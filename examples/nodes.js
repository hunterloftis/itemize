const itemize = require('..')
const releases = itemize('https://nodejs.org/download/release/', { depth: 1 })
const BINARY = /(.*)node-(.*).tar.gz/

list()

// List all the node binaries on nodejs.org
async function list() {
  while (!releases.done()) {
    const url = await releases.next()
    if (url.match(BINARY)) console.log(`==> ${url}`)
    else console.log(`    ${url}`)
  }
}
