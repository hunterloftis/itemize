const itemize = require('..')
const express = require('express')

let server, items
let lastHeaders

beforeAll((done) => {
  const app = createApp()
  items = itemize('http://localhost:5000/base/', { depth: 2 })
  server = app.listen(5000, done)
})

test('first returns the root URL', async () => {
  const item = await items.next()
  expect(item).toBe('http://localhost:5000/base/')
})

test('uses a keep-alive connection', async () => {
  const item = await items.next()
  expect(lastHeaders['connection']).toBe('keep-alive')
})

test('finds 5 items total', async () => {
  while (!items.done()) await items.next()
  expect((await items.all()).length).toBe(5)
})

test('does not find the deep url', async () => {
  const hasDeep = (await items.all()).join('').includes('/deep')
  expect(hasDeep).toBe(false)
})

test('does not move up to the parent route', async () => {
  expect(await items.all()).not.toContain('http://localhost:5000/')
})

test('returns undefined when all items have been returned', async () => {
  let i = 10
  while(i--) {
    let item = await items.next()
    expect(item).toBeUndefined()
  }
})

test('can be closed before completion', async () => {
  const unfinished = itemize('http://localhost:5000/base/', { depth: 2 })
  await unfinished.next()
  unfinished.close()
})

afterAll((done) => {
  server.close(done)
})

function createApp () {
  return express()
    .use((req, res, next) => {
      lastHeaders = Object.assign({}, req.headers)
      next()
    })
    .get('/', (req, res) => res.send('root'))
    .get('/base/', (req, res) => {
      res.send("<html><body><a href='..'>..</a><a href='a/'>a</a><a href='b/'>b</b></body></html>")
    })
    .get('/base/a', (req, res) => {
      res.send("<html><body><a href='file.txt'>file</a><a href='../b/'>b</a></body></html>")
    })
    .get('/base/a/file.txt', (req, res) => {
      res.set({ 'content-type': 'text/plain' }).send('file contents\n')
    })
    .get('/base/b/', (req, res) => {
      res.send("<html><body><a href='notfound'>404</a><a href='/'>root</a><a href='foo/bar/baz/deep'>deep</a></body></html>")
    })
    .get('/base/b/foo/bar/baz/deep', (req, res) => res.send('deep'))
}
