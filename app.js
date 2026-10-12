// Loads the herbs from data/herbs.json and shows each one as a card.

const list = document.querySelector("#herb-list")
const count = document.querySelector(".count")

async function loadHerbs() {
  const response = await fetch("data/herbs.json")
  if (!response.ok) {
    throw new Error(`Could not load ${response.url}: ${response.status} ${response.statusText}`)
  }
  return response.json()
}

function element(tag, className, text) {
  const node = document.createElement(tag)
  node.className = className
  node.textContent = text
  return node
}

function card(herb) {
  const item = element("li", "card", "")
  item.append(
    element("h3", "name", herbs.name),
    element("p", "latin", herbs.latin),
    element("p", "use", herbs.use),
    element("p", "life", herb.life))
  return item
}

async function show() {
  const herbs = await loadHerbs()
  list.replaceChildren(...herbs.map(card))
  count.textContent = `${herbs.length} herbs grow here.`
}

show()
