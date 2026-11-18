// Rows from different collections can be nested inside the same editor.
const orderRows = new WeakMap();
let cancelActiveDrag = null;

function insertionIndex(source, target, after) {
  const gap = target + Number(after);
  return gap > source ? gap - 1 : gap;
}

function edgeSpeed(position, start, end) {
  const zone = Math.min(48, (end - start) / 4);
  if (position < start || position > end) return 0;
  if (position < start + zone) return -Math.ceil(12 * (start + zone - position) / zone);
  if (position > end - zone) return Math.ceil(12 * (position - end + zone) / zone);
  return 0;
}

function orderControls(container, list, index, afterMove = editFields) {
  const bar = element("div", "", "order-controls");
  const grip = element("span", "Drag", "drag-grip");
  orderRows.set(container, {list, index});

  function move(to) {
    if (to === index || to < 0 || to >= list.length) return;
    const [item] = list.splice(index, 1);
    list.splice(to, 0, item);
    afterMove();
  }

  grip.onpointerdown = event => {
    if (!event.isPrimary || event.button !== 0 || list.length < 2) return;
    cancelActiveDrag?.();
    const pointer = event.pointerId;
    const startX = event.clientX, startY = event.clientY;
    let x = startX, y = startY, active = false, frame = 0;
    let marked, markerClass, destination = index;
    const parent = container.parentElement;
    const studio = container.closest("dialog");
    const siblings = Array.from(parent.children).filter(node => orderRows.get(node)?.list === list);
    const across = getComputedStyle(parent).display === "flex" &&
      getComputedStyle(parent).flexDirection.startsWith("row");

    function hitTest() {
      let target = null, nextClass = "";
      destination = index;
      const bounds = parent.getBoundingClientRect();
      const inside = document.elementFromPoint(x, y);
      if (inside && parent.contains(inside) && x >= bounds.left && x <= bounds.right &&
          y >= bounds.top && y <= bounds.bottom) {
        let best = Infinity;
        for (const row of siblings) {
          const rect = row.getBoundingClientRect();
          const dx = Math.max(rect.left - x, 0, x - rect.right);
          const dy = Math.max(rect.top - y, 0, y - rect.bottom);
          const distance = dx * dx + dy * dy;
          if (distance < best) { best = distance; target = row; }
        }
        if (target) {
          const rect = target.getBoundingClientRect();
          const after = across ? x > rect.left + rect.width / 2 : y > rect.top + rect.height / 2;
          destination = insertionIndex(index, orderRows.get(target).index, after);
          if (destination === index) target = null;
          else nextClass = "insert-" + (across ? (after ? "right" : "left") : (after ? "below" : "above"));
        }
      }
      if (marked !== target || nextClass !== markerClass) {
        if (marked) marked.classList.remove(markerClass);
        if (target) target.classList.add(nextClass);
        marked = target; markerClass = nextClass;
      }
    }

    function tick() {
      if (!grip.isConnected || !studio.open) { finish(); return; }
      const rect = studio.getBoundingClientRect();
      if (x >= rect.left && x <= rect.right) studio.scrollTop += edgeSpeed(y, rect.top, rect.bottom);
      if (across && parent.scrollWidth > parent.clientWidth) {
        const strip = parent.getBoundingClientRect();
        if (y >= strip.top && y <= strip.bottom) parent.scrollLeft += edgeSpeed(x, strip.left, strip.right);
      }
      hitTest();
      frame = requestAnimationFrame(tick);
    }
    function finish() {
      cancelAnimationFrame(frame);
      if (marked) marked.classList.remove(markerClass);
      container.classList.remove("being-moved");
      studio.classList.remove("reordering");
      grip.onpointermove = grip.onpointerup = grip.onlostpointercapture = grip.onpointercancel = null;
      if (grip.hasPointerCapture(pointer)) grip.releasePointerCapture(pointer);
      window.removeEventListener("blur", finish);
      document.removeEventListener("keydown", escape, true);
      cancelActiveDrag = null;
    }
    function escape(key) {
      if (key.key === "Escape") { key.preventDefault(); key.stopPropagation(); finish(); }
    }
    cancelActiveDrag = finish;
    window.addEventListener("blur", finish);
    document.addEventListener("keydown", escape, true);
    grip.setPointerCapture(pointer);
    grip.onpointermove = e => {
      if (e.pointerId !== pointer) return;
      x = e.clientX; y = e.clientY;
      if (!active && Math.hypot(x - startX, y - startY) >= 4) {
        active = true;
        container.classList.add("being-moved");studio.classList.add("reordering");
        tick();
      }
    };
    grip.onpointerup = e => {
      if (e.pointerId !== pointer) return;
      x = e.clientX; y = e.clientY;
      if (active) hitTest();
      finish();
      if (active) move(destination);
    };
    grip.onpointercancel = grip.onlostpointercapture = finish;
  };
  bar.append(grip);
  if (index > 0) action(bar, "Move up", () => move(index - 1));
  if (index + 1 < list.length) action(bar, "Move down", () => move(index + 1));
  container.prepend(bar);
}
