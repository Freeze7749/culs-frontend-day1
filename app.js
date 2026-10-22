// Loads the herb names from data/herbs.json, then each herb from
// data/<name>.json, and shows each one as a card.
// When the address ends in #<name>, shows that one herb instead of the list.

const herbsSection = document.querySelector("#herbs")
const list = document.querySelector("#herbs-list")
const count = document.querySelector(".count")
const detail = document.querySelector("#herb-detail")
const detailContent = document.querySelector("#herb-detail-content")

// Thrown when the server cannot be reached at all.
class NetworkError extends Error {}

// Thrown when the server answers, but without the file (for example 404 Not Found).
class HttpError extends Error {}

async function loadJson(path) {
  let response
  try {
    response = await fetch(path)
  } catch (error) {
    throw new NetworkError(`Could not reach the server for ${path}: ${error.message}`)
  }
  if (!response.ok) {
    throw new HttpError(`Could not load ${response.url}: ${response.status} ${response.statusText}`)
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

// A message that screen readers announce as soon as it appears.
function problem(text) {
  const node = element("p", "problem", text)
  node.setAttribute("role", "alert")
  return node
}

// Turns a loading error into a friendly message about `what` could not be loaded.
function problemText(error, what) {
  if (error instanceof NetworkError) {
    return "We could not reach the server. Check your connection, then reload the page to try again."
  }
  return `Sorry, ${what} could not be loaded.`
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
  let herbNames
  try {
    herbNames = await names
  } catch (error) {
    count.textContent = "No herbs to show."
    count.after(problem(problemText(error, "the list of herbs")))
    return
  }

  // Show every herb that loaded, even if some of them did not.
  const results = await Promise.allSettled(herbNames.map(loadHerb))
  const cards = results
    .map((result, i) => (result.status === "fulfilled" ? card(result.value, herbNames[i]) : null))
    .filter((item) => item !== null)
  list.replaceChildren(...cards)
  count.textContent = `${cards.length} herbs grow here.`

  // If any herb failed because the server was unreachable, say so: reloading may help.
  const errors = results.filter((result) => result.status === "rejected").map((result) => result.reason)
  if (errors.length > 0) {
    const error = errors.find((reason) => reason instanceof NetworkError) ?? errors[0]
    count.after(problem(problemText(error, "some of the herbs")))
  }
}

// The part of the address after "#", e.g. "basil" for ".../#basil".
function hashName() {
  const raw = location.hash.slice(1)
  try {
    return decodeURIComponent(raw)
  } catch {
    return raw // not valid %-encoding, e.g. "#100%"
  }
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

function showDetail(name, nodes) {
  if (hashName() !== name) {
    return // the address changed while this herb was loading
  }

  detailContent.replaceChildren(...nodes)
  herbsSection.hidden = true
  detail.hidden = false
  detail.scrollIntoView()
}

function herbDetails(herb) {
  return [
    element("h2", "name", herb.name),
    element("p", "latin", herb.latin),
    element("p", "use", herb.use),
    element("p", "life", herb.life),
    element("p", "description", herb.description),
    element("h3", "", "Growing"),
    element("p", "growing", herb.growing),
    element("h3", "", "Kitchen tip"),
    element("p", "tip", herb.tip)
  ]
}

// Decides what to show for the current address.
// Anchors that already exist on the page (#herbs, #visit, #about…) win over herb names.
async function route() {
  const name = hashName()
  const isPageAnchor = document.getElementById(name) !== null

  if (name === "" || isPageAnchor) {
    showList()
    return
  }

  try {
    if (!(await names).includes(name)) {
      showDetail(name, [problem(`Sorry, we could not find a herb called “${name}”.`)])
      return
    }
    showDetail(name, herbDetails(await loadHerb(name)))
  } catch (error) {
    showDetail(name, [problem(problemText(error, "the information about this herb"))])
  }
}

window.addEventListener("hashchange", route)

show()
route()
