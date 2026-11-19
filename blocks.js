function renderBlock(block) {
  if (block.kind === "image") {
    const figure = element("figure");
    figure.className = "media size-" + block.size + " align-" + block.align;
    const image = element("img");
    if (/^data:image\/jpeg;base64,/.test(block.src)) image.src = block.src;
    image.alt = block.alt || "";
    image.loading = "lazy";
    figure.append(image);
    if (block.caption) figure.append(element("figcaption",block.caption));
    return figure;
  }
  const tags = {paragraph:"p", heading:"h4", quote:"blockquote", bullets:"ul"};
  const node = element(tags[block.kind] || "p");
  function inline(parent, text) {
    for (const part of text.split(/(\*\*[^*\n]+\*\*|\*[^*\n]+\*)/g)) {
      if (part.startsWith("**") && part.endsWith("**")) parent.append(element("strong",part.slice(2,-2)));
      else if (part.startsWith("*") && part.endsWith("*") && part.length>2) parent.append(element("em",part.slice(1,-1)));
      else parent.append(document.createTextNode(part));
    }
  }
  if (block.kind === "bullets") {
    for (const line of block.text.split("\n").filter(Boolean)) {
      const li=element("li");inline(li,line);node.append(li);
    }
  } else inline(node,block.text);
  return node;
}
function selectField(parent,title,obj,key,options) {
  const label=element("label",title),select=element("select");
  for(const value of options) select.append(new Option(value,value));
  select.value=obj[key];
  select.onchange=()=>{obj[key]=select.value;editFields()};
  label.append(select);parent.append(label);
}
function blockEditor(parent,entry) {
  const blocks=entry.blocks ||= [];
  blocks.forEach((block,i)=>{
    const panel=element("fieldset");
    panel.append(element("legend",block.kind==="image"?"Image":"Text block"));
    if (block.kind==="image") {
      panel.append(renderBlock(block));
      field(panel,"Alternative text",block,"alt");
      field(panel,"Caption",block,"caption");
      selectField(panel,"Width",block,"size",["small","medium","full"]);
      selectField(panel,"Alignment",block,"align",["left","center","right"]);
    } else {
      selectField(panel,"Format",block,"kind",["paragraph","heading","quote","bullets"]);
      const input=field(panel,"Text",block,"text",true);
      for(const [label,mark] of [["Bold","**"],["Italic","*"]]) {
        action(panel,label,()=>{
          const start=input.selectionStart,end=input.selectionEnd;
          input.setRangeText(mark+(input.value.slice(start,end)||"text")+mark,start,end,"select");
          block.text=input.value;input.focus();
        });
      }
    }
    orderControls(panel,blocks,i);
    action(panel,"Remove block",()=>{blocks.splice(i,1);editFields()});
    parent.append(panel);
  });
  action(parent,"Add text",()=>{blocks.push({kind:"paragraph",text:""});editFields()});
  const label=element("label","Drop images here or choose files");label.className="image-drop";
  const upload=element("input");upload.type="file";upload.accept="image/jpeg,image/png,image/webp";
  upload.multiple=true;
  async function addImage(file){
    const session=draft;
    let bitmap;
    try {
      bitmap=await createImageBitmap(file);
      const factor=Math.min(1,1400/Math.max(bitmap.width,bitmap.height));
      const canvas=element("canvas");
      canvas.width=Math.max(1,Math.round(bitmap.width*factor));canvas.height=Math.max(1,Math.round(bitmap.height*factor));
      const ctx=canvas.getContext("2d");ctx.fillStyle="#18181b";ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);
      if(draft!==session || !dialog.open)return;
      blocks.push({kind:"image",src:canvas.toDataURL("image/jpeg",.8),alt:"",caption:"",align:"center",size:"full"});
      editFields();
    } catch {byId("notice").textContent="Could not read that image. Try a JPEG, PNG or WebP file."}
    finally {bitmap?.close()}
  };
  async function addImages(files){for(const file of Array.from(files))await addImage(file)}
  upload.onchange=()=>addImages(upload.files);
  label.ondragover=event=>{if(event.dataTransfer.types.includes("Files"))event.preventDefault()};
  label.ondrop=event=>{event.preventDefault();event.stopPropagation();addImages(event.dataTransfer.files)};
  label.append(upload);parent.append(label);
}
