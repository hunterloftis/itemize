const itemize = require('..')

list()  // Get a quick Hacker News sitemap

async function list() {
  const urls = itemize('https://news.ycombinator.com', { depth: 2 })
  while (!urls.done()) {
    console.log(await urls.next())
  }
}
