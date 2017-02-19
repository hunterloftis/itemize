const itemize = require('..')

const URL = 'https://nodejs.org/download/release/'
const BINARY = /(.*)node-(.*).tar.gz/

list()  // List all the node binaries on nodejs.org

async function list() {
  const releases = itemize(URL, { depth: 1 })
  while (!releases.done()) {
    const url = await releases.next()
    if (url.match(BINARY)) console.log(`==> ${url}`)
    else console.log(`    ${url}`)
  }
}
