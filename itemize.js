const request = require('requisition')
const cheerio = require('cheerio')
const resolve = require('url').resolve
const log = require('util').debuglog('itemize')
const url = require('url')

module.exports = itemize

function itemize (root, opts) {
  const options = Object.assign({ depth: 0 }, opts)
  const queue = [root]
  const visited = []
  let incrementor = 0

  return { next, all, done }

  async function next () {
    while (queue.length > 0 && visited.length <= incrementor) {
      await scrape(queue.shift())
    }
    if (visited.length > incrementor) return visited[incrementor++]
    if (queue.length === 0) return undefined
  }

  function all () {
    return visited
  }

  function done () {
    return queue.length === 0 && incrementor >= visited.length
  }

  async function scrape (target) {
    const depth = target.slice(root.length).split('/').length - 1
    const inbounds = depth <= options.depth
    const fresh = visited.indexOf(target) === -1
    if (inbounds && fresh) {
      visited.push(target)
      const response = await request.get(target)
      const content = response.get('content-type')
      const html = content && content.includes('/html')
      if (html) {
        log(`scraping ${target}`)
        const body = await response.text()
        const links = parse(target, body)
        queue.push(...links)
      } else {
        response.destroy()
      }
    }
  }

  function parse (uri, body) {
    const $ = cheerio.load(body)
    const links = $('a').map((i, el) => $(el).attr('href')).get()
    const children = links.map(link => resolve(uri, link))
                          .map(unquery)
                          .filter(link => link.startsWith(uri))
    return children
  }

  function unquery (uri) {
    const stripped = Object.assign(url.parse(uri), { search: '', query: '', hash: '' })
    return url.format(stripped)
  }
}
