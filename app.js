const byId = id => document.getElementById(id);
function element(tag, text, cls) {
  const node = document.createElement(tag);
  if (text) node.textContent = text;
  if (cls) node.className = cls;
  return node;
}
let portfolio = structuredClone(initialPortfolio);
let revision = null;
let draft;
function render(view = portfolio) {
  byId("brand").textContent = view.brand;
  document.title = view.brand;
  byId("signature").textContent = view.brand;
  byId("name").replaceChildren(...view.name.trim().split(/\s+/).map(word => element("span", word)));
  byId("bio").textContent = view.bio;
  byId("nav").replaceChildren();
  byId("sections").replaceChildren();
  function link(title,id) {
    const a = element("a", title);
    a.href = "#" + id;
    byId("nav").append(a);
  }
  link("About","about");
  let first;
  view.sections.forEach((section,index) => {
    if (!section.entries.length) return;
    const block = element("section", "", "collection");
    block.id = "section-" + index;
    first ||= block.id;
    link(section.title,block.id);
    block.append(element("h2",section.title));
    section.entries.forEach(entry => {
      const card = element("article","","card");
      const layout = entry.layout || (entry.art === "moon" ? "left" : "inline");
      const blocks = entry.blocks || [];
      const cover = layout === "inline" ? null : blocks.find(block => block.kind === "image");
      const visual = cover ? renderBlock(cover) : entry.art === "moon" ? element("canvas","","terrain") : null;
      if (visual) {
        card.classList.add("layout-" + layout);
        visual.classList.add("card-visual");
        card.append(visual);
      }
      const copy = element("div","","copy");
      copy.append(element("div",entry.label,"label"),element("h3",entry.title),element("p",entry.text));
      if (/^(https?:\/\/|mailto:)/i.test(entry.url)) {
        const a = element("a","Open link"); a.href=entry.url; copy.append(a);
      }
      for (const block of blocks) if (block !== cover) copy.append(renderBlock(block));
      card.append(copy); block.append(card);
    });
    byId("sections").append(block);
  });
  byId("explore").hidden = !first;
  byId("explore").style.display = first ? "" : "none";
  byId("explore").href = "#" + first;
  showContacts(view,link);
  window.drawArtwork?.();
}
function field(parent,title,obj,key,multiline=false) {
  const label = element("label",title);
  const input = element(multiline?"textarea":"input");
  input.value=obj[key] || "";
  input.oninput=()=>obj[key]=input.value;
  label.append(input); parent.append(label); return input;
}
function action(parent,title,handler) {
  const button=element("button",title);
  button.type="button"; button.onclick=handler; parent.append(button);
}
let selected = -1;
let focusedEntry = null;
function layoutPicker(parent,entry) {
  const group=element("fieldset","","layout-picker");
  group.append(element("legend","Card layout"));
  const current=entry.layout || (entry.art==="moon" ? "left" : "inline");
  for(const [value,title] of [["inline","In text"],["left","Image left"],["right","Image right"],["top","Image above"]]) {
    const label=element("label");
    const radio=element("input");
    radio.type="radio";radio.name="card-layout";radio.value=value;radio.checked=current===value;
    radio.onchange=()=>{entry.layout=value;editFields()};
    const diagram=element("span","","diagram diagram-"+value);
    diagram.setAttribute("aria-hidden","true");
    diagram.append(element("i"),element("b"));
    label.append(radio,diagram,document.createTextNode(title));
    group.append(label);
  }
  group.append(element("small","Image layouts use the first image in the entry. Drag another image above it to change the cover."));
  parent.append(group);
}
function editFields() {
  const fields=byId("fields"); fields.replaceChildren();
  byId("contacts").onclick=()=>{selected=-2;editFields()};
  byId("contacts").setAttribute("aria-pressed",String(selected===-2));
  if(selected===-2)contactEditor(fields);
  const outline=byId("outline");outline.replaceChildren();
  byId("profile").onclick=()=>{selected=-1;editFields()};
  draft.sections.forEach((section,index)=>{
    const row=element("div","","outline-row");
    const active=draft.sections[selected];
    action(row,section.title || "Untitled section",()=>{selected=index;editFields()});
    if(selected===index)row.classList.add("current");
    row.lastElementChild.setAttribute("aria-pressed",String(selected===index));
    orderControls(row,draft.sections,index,()=>{selected=draft.sections.indexOf(active);editFields()});
    outline.append(row);
  });
  byId("profile").setAttribute("aria-pressed", String(selected === -1));
  if(selected === -1) {
  fields.append(element("h3","Profile"));
  field(fields,"Site name",draft,"brand"); field(fields,"Your name",draft,"name");
  field(fields,"Introduction",draft,"bio",true);
  }
  draft.sections.forEach((section,index)=>{
    if(index!==selected) return;
    const group=element("fieldset"); fields.append(group);
    const title=field(group,"Section title",section,"title");
    title.addEventListener("input",()=>outline.children[index].lastElementChild.textContent=title.value || "Untitled section");
    action(group,"+ Add entry",()=>{focusedEntry={title:"New entry"};section.entries.push(focusedEntry);editFields()});
    if(!section.entries.includes(focusedEntry))focusedEntry=section.entries[0];
    const choices=element("div","","entry-choices");
    group.append(choices);
    section.entries.forEach((entry,i)=>{
      const row=element("div","","entry-choice");
      action(row,entry.title || "Untitled entry",()=>{focusedEntry=entry;editFields()});
      const choice=row.lastElementChild;
      choice.setAttribute("aria-pressed",String(entry===focusedEntry));
      orderControls(row,section.entries,i);
      choices.append(row);
    });
    section.entries.forEach((entry,i)=>{
      if(entry!==focusedEntry)return;
      const item=element("fieldset"); group.append(item);
      item.append(element("legend","Selected entry"));
      layoutPicker(item,entry);
      field(item,"Entry title",entry,"title").addEventListener("input",()=>choices.children[i].lastElementChild.textContent=entry.title || "Untitled entry"); field(item,"Label",entry,"label");
      field(item,"Description",entry,"text",true); field(item,"Link",entry,"url");
      blockEditor(item,entry);
      action(item,"Remove entry",()=>{section.entries.splice(i,1);editFields()});
    });

    action(group,"Remove section",()=>{draft.sections.splice(index,1);selected=-1;editFields()});
  });
}
const dialog=document.querySelector("dialog");
byId("edit").onclick=()=>{draft=structuredClone(portfolio);editFields();dialog.showModal()};
function discard(){dialog.close();draft=null;byId("resume").hidden=true;render()}
byId("cancel").onclick=discard;
dialog.oncancel=event=>{event.preventDefault();discard()};
byId("preview").onclick=()=>{dialog.close();render(draft);byId("edit").hidden=true;byId("resume").hidden=false;window.scrollTo(0,selected===-2?byId("contact").offsetTop:selected<0?0:document.querySelectorAll(".collection")[draft.sections.slice(0,selected).filter(s=>s.entries.length).length]?.offsetTop || 0)};
byId("resume").onclick=()=>{byId("resume").hidden=true;byId("edit").hidden=false;render();editFields();dialog.showModal()};
byId("addSection").onclick=()=>{draft.sections.push({title:"New section",entries:[]});selected=draft.sections.length-1;editFields()};
byId("editor").onsubmit = event => {
  event.preventDefault();
  const source = "const initialPortfolio = " + JSON.stringify(draft, null, 2) + ";\n";
  const url = URL.createObjectURL(new Blob([source], {type:"text/javascript"}));
  const download = element("a");
  download.href = url;
  download.download = "content.js";
  document.body.append(download);
  download.click();
  download.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
  portfolio = draft;
  render();
  dialog.close();
};
const studioMode=location.protocol==="file:" || location.pathname.endsWith("/studio.html");
byId("edit").hidden=!studioMode;
if(studioMode && location.pathname.endsWith("/studio.html"))byId("edit").click();
render();
