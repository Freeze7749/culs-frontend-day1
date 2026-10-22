// Loads the herb names from data/herbs.json, then each herb from
// data/<name>.json, and shows each one as a card.
// When the address ends in #<name>, shows that one herb instead of the list.

const herbsSection = document.querySelector("#herbs")
const list = document.querySelector("#herbs-list")
const count = document.querySelector(".count")
const detail = document.querySelector("#herb-detail")
const detailContent = document.querySelector("#herb-detail-content")

async function loadJson(path) {
  const response = await fetch(path)
  if (!response.ok) {
    throw new Error(`Could not load ${response.url}: ${response.status} ${response.statusText}`)
  }
  return response.json()
}

// The list of herb names, loaded once and shared by the list and the detail page.
const names = loadJson("data/herbs.json")

function loadHerb(name) {
  return loadJson(`data/${name}.json`)
}

function element(tag, className, text) {
  const node = document.createElement(tag)
  node.className = className
  node.textContent = text
  return node
}

function card(herb, name) {
  const item = element("li", "card", "")
  const title = element("h3", "name", "")

  const link = document.createElement("a")
  link.href = `#${encodeURIComponent(name)}`
  link.textContent = herb.name
  title.append(link)

  item.append(
    title,
    element("p", "latin", herb.latin),
    element("p", "use", herb.use),
    element("p", "life", herb.life)
  )

  return item
}

async function show() {
  const herbNames = await names
  const herbs = await Promise.all(herbNames.map(loadHerb))
  list.replaceChildren(...herbs.map((herb, i) => card(herb, herbNames[i])))
  count.textContent = `${herbs.length} herbs grow here.`
}

// The part of the address after "#", e.g. "basil" for ".../#basil".
function hashName() {
  return decodeURIComponent(location.hash.slice(1))
}

function showList() {
  const wasHidden = herbsSection.hidden
  detail.hidden = true
  herbsSection.hidden = false

  // The browser cannot scroll to an anchor while the list is hidden,
  // so scroll there ourselves once the list is back.
  const target = document.getElementById(hashName())
  if (wasHidden && target) {
    target.scrollIntoView()
  }
}

async function showDetail(name) {
  const herb = await loadHerb(name)
  if (hashName() !== name) {
    return // the address changed while this herb was loading
  }

  detailContent.replaceChildren(
    element("h2", "name", herb.name),
    element("p", "latin", herb.latin),
    element("p", "use", herb.use),
    element("p", "life", herb.life)
  )
  herbsSection.hidden = true
  detail.hidden = false
  detail.scrollIntoView()
}

// Decides what to show for the current address.
// Anchors that already exist on the page (#herbs, #visit, #about…) win over herb names.
async function route() {
  const name = hashName()
  const isPageAnchor = document.getElementById(name) !== null

  if (name === "" || isPageAnchor || !(await names).includes(name)) {
    showList()
  } else {
    await showDetail(name)
  }
}

window.addEventListener("hashchange", route)

show()
route()
