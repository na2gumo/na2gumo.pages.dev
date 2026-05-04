const elems = document.getElementsByClassName("links");

for (let i = 0; i < elems.length; i++) {
  const el = elems[i];
  el.addEventListener("mouseenter", () => {
    if (el.classList.contains("jump")) return;
    el.classList.add("jump");
    //prettier-ignore
    el.addEventListener('animationend', () => {
      el.classList.remove('jump')
    }, { once:true })
  });
}
