const itemize = require('..')
const urls = itemize('https://news.ycombinator.com', { depth: 2 })

list()

// Get a quick Hacker News sitemap
async function list() {
  while (!urls.done()) {
    console.log(await urls.next())
  }
}
