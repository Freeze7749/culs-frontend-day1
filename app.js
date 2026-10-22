// Loads the herb names from data/herbs.json, then each herb from
// data/<name>.json, and shows each one as a card.

const list = document.querySelector("#herbs-list")
const count = document.querySelector(".count")

async function loadJson(path) {
  const response = await fetch(path)
  if (!response.ok) {
    throw new Error(`Could not load ${response.url}: ${response.status} ${response.statusText}`)
  }
  return response.json()
}

async function loadHerbs() {
  const names = await loadJson("data/herbs.json")
  return Promise.all(names.map((name) => loadJson(`data/${name}.json`)))
}

function element(tag, className, text) {
  const node = document.createElement(tag)
  node.className = className
  node.textContent = text
  return node
}

function card(herb) {
  const item = element("li", "card", "")
  const title = element("h3", "name", "")

  const link = document.createElement("a")
  link.href = `#${herb.name.toLowerCase()}`
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
  const herbs = await loadHerbs()
  list.replaceChildren(...herbs.map(card))
  count.textContent = `${herbs.length} herbs grow here.`
}

show()
