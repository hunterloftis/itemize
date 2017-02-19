const request = require('requisition')
const cheerio = require('cheerio')
const resolve = require('url').resolve
const log = require('util').debuglog('itemize')
const url = require('url')
const httpAgent = require('http').Agent
const httpsAgent = require('https').Agent

module.exports = itemize

function itemize (root, opts) {
  const options = Object.assign({ depth: 0 }, opts)
  const queue = [root]
  const visited = []
  let agent = agency(root)
  let incrementor = 0

  return { next, all, done, close }

  async function next () {
    while (queue.length > 0 && visited.length <= incrementor) {
      await scrape(queue.shift())
    }
    if (visited.length > incrementor) return visited[incrementor++]
    if (queue.length === 0) {
      close()
      return undefined
    }
  }

  function all () {
    return new Promise((resolve, reject) => {
      setImmediate(() => { resolve(visited.slice(0, incrementor)) })
    })
  }

  function done () {
    return queue.length === 0 && incrementor >= visited.length
  }

  function close () {
    agent.destroy()
    agent = agency(root)
  }

  async function scrape (target) {
    const depth = target.slice(root.length).split('/').length - 1
    const inbounds = depth <= options.depth
    const fresh = visited.indexOf(target) === -1
    if (inbounds && fresh) {
      visited.push(target)
      const head = await request.head(target).agent(agent)
      const content = head.get('content-type')
      const html = content && content.includes('/html')
      head.dump()
      if (html) {
        log(`scraping ${target}`)
        const response = await request.get(target).agent(agent)
        const body = await response.text()
        const links = parse(target, body)
        queue.push(...links)
        response.dump()
      }
    }
  }
}

function agency (uri) {
  const proto = url.parse(uri).protocol
  const Agent = proto === 'https:' ? httpsAgent : httpAgent
  return new Agent({ keepAlive: true })
}

function parse (uri, body) {
  const $ = cheerio.load(body)
  const links = $('a').map((i, el) => $(el).attr('href')).get()
  const children = links.map(link => resolve(uri, link))
                        .map(simplify)
                        .filter(link => link.startsWith(uri))
  return children
}

function simplify (uri) {
  const stripped = Object.assign(url.parse(uri), { search: '', query: '', hash: '' })
  return url.format(stripped)
}
