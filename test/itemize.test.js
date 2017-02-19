const itemize = require('..')
const express = require('express')

let server, items

beforeAll((done) => {
  const app = createApp()
  items = itemize('http://localhost:5000/base/', { depth: 2 })
  server = app.listen(5000, done)
})

test('the first item is the root URL', async () => {
  const item = await items.next()
  expect(item).toBe('http://localhost:5000/base/')
})

test('finds 5 items total', async () => {
  let i = 0
  while (await items.next()) i++
  expect(i).toBe(4)
  expect(items.all().length).toBe(5)
})

test('does not find the deep url', () => {
  const hasDeep = items.all().join('').includes('/deep')
  expect(hasDeep).toBe(false)
})

test('does not move up to the root url', () => {
  expect(items.all()).not.toContain('http://localhost:5000/')
})

afterAll((done) => {
  server.close(done)
})

function createApp () {
  return express()
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
