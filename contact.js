const contactServices = [
  ["linkedin","LinkedIn","linkedin.com/in/your-name","in"],
  ["github","GitHub","github.com/username","GH"],
  ["htb","Hack The Box","app.hackthebox.com/profile/12345","HTB"],
  ["thm","TryHackMe","tryhackme.com/p/username","THM"],
  ["email","Business email","you@example.com","@"],
  ["phone","Phone number","+44 …","☎"]
];

function contactHref(key,raw) {
  const value = raw.trim();
  if (!value) return "";
  if (key === "email") return /^[^\s@?#]+@[^\s@?#]+\.[^\s@?#]+$/.test(value) ? "mailto:" + value : "";
  if (key === "phone") {
    const digits = value.replace(/[\s().-]/g,"");
    return /^\+?\d{5,15}$/.test(digits) ? "tel:" + digits : "";
  }
  try {
    const url = new URL(/^https?:\/\//i.test(value) ? value : "https://" + value);
    if (!url.hostname.includes(".") || url.username || url.password || /\s/.test(value)) return "";
    url.protocol = "https:";
    return url.href;
  } catch { return ""; }
}

function contactCard(parent,key,label,value,initials) {
  const href = contactHref(key,value || "");
  if (!href) return;
  const a = element("a","","contact-card");a.href = href;
  const mark = element("span",initials,"contact-mark");
  mark.setAttribute("aria-hidden","true");
  if (href.startsWith("https:")) {
    const image = element("img");
    image.alt=""; image.referrerPolicy="no-referrer";
    image.onload=()=>mark.replaceChildren(image);
    image.src="https://www.google.com/s2/favicons?sz=64&domain="+encodeURIComponent(new URL(href).hostname);
  }
  const words=element("span");
  words.append(element("strong",label),element("small",href.startsWith("https:") ? new URL(href).hostname : value));
  a.append(mark,words);parent.append(a);
}

function showContacts(view,link) {
  const section=byId("contact");section.replaceChildren();
  const grid=element("div","","contact-grid");
  const contacts=view.contacts || {};
  for(const [key,label,,mark] of contactServices) contactCard(grid,key,label,contacts[key],mark);
  for(const item of contacts.other || []) contactCard(grid,"url",item.name || "Website",item.url,"↗");
  section.hidden=!grid.childElementCount;
  if(!section.hidden){section.append(element("h2","Contact & profiles"),grid);link("Contact","contact")}
}

function contactEditor(fields) {
  const contacts=draft.contacts ||= {};
  fields.append(element("h3","Contact & profiles"),element("p","Filled fields appear on your portfolio. Leave any field blank to hide it."));
  function input(parent,label,obj,key,kind,placeholder) {
    const box=field(parent,label,obj,key);
    box.placeholder=placeholder;
    function validate(){box.setCustomValidity(box.value.trim() && !contactHref(kind,box.value) ? "Enter a valid "+label.toLowerCase()+"." : "")}
    box.addEventListener("input",validate);validate();
  }
  for(const [key,label,placeholder] of contactServices)input(fields,label,contacts,key,key,placeholder);
  fields.append(element("small","A phone number entered here will be visible to visitors after you publish."));
  const other=contacts.other ||= [];
  other.forEach((item,index)=>{
    const group=element("fieldset");group.append(element("legend","Other profile"));
    field(group,"Platform name",item,"name");input(group,"Profile URL",item,"url","url","https://");
    action(group,"Remove profile",()=>{other.splice(index,1);editFields()});fields.append(group);
  });
  action(fields,"+ Add another profile",()=>{other.push({name:"",url:""});editFields()});
}
