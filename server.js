const express=require("express"),fs=require("fs"),path=require("path"),crypto=require("crypto");
const app=express();app.use(express.json({limit:"1mb"}));app.use(express.static(path.join(__dirname,"public")));
const DB=path.join(__dirname,"data.json");
const teams=[["jupiter","المشتري","Jupiter","🪐"],["saturn","زحل","Saturn","💍"],["neptune","نبتون","Neptune","🔵"],["uranus","أورانوس","Uranus","🩵"]];
let db;
if(fs.existsSync(DB)) db=JSON.parse(fs.readFileSync(DB,"utf8")); else {db={members:[],posts:[{id:crypto.randomUUID(),title:"مرحباً بكم في المجرة 🚀",body:"استعدوا للتحديات القادمة!",team:"all",date:new Date().toLocaleString("ar-EG")}],scores:{jupiter:1250,saturn:1100,neptune:980,uranus:870}};save()}
function save(){fs.writeFileSync(DB,JSON.stringify(db,null,2),"utf8")}
function validTeam(t){return teams.some(x=>x[0]===t)}
function auth(req,res,next){if(req.headers["x-admin-key"]!==process.env.ADMIN_KEY)return res.status(401).json({error:"غير مصرح"});next()}
app.post("/api/join",(req,res)=>{let name=String(req.body.name||"").trim(),team=req.body.team;if(name.length<2||!validTeam(team))return res.status(400).json({error:"بيانات التسجيل غير صحيحة"});let m={id:crypto.randomUUID(),name,team,createdAt:new Date().toISOString()};db.members.push(m);save();res.json(m)});
app.get("/api/member/:id",(req,res)=>{let m=db.members.find(x=>x.id===req.params.id);if(!m)return res.status(404).json({error:"العضو غير موجود"});res.json(m)});
app.get("/api/public",(req,res)=>res.json({posts:db.posts,teams:teams.map(t=>({id:t[0],name:t[1],en:t[2],icon:t[3],score:db.scores[t[0]]||0}))}));
app.post("/api/admin/login",(req,res)=>{if(String(req.body.password||"")===String(process.env.ADMIN_KEY||""))res.json({ok:true});else res.status(401).json({error:"كلمة المرور غير صحيحة"})});
app.use("/api/admin",auth);
app.get("/api/admin",(req,res)=>res.json({members:db.members,posts:db.posts,teams:teams.map(t=>({id:t[0],name:t[1],icon:t[3],score:db.scores[t[0]]||0}))}));
app.post("/api/admin/post",(req,res)=>{let title=String(req.body.title||"").trim(),body=String(req.body.body||"").trim(),team=req.body.team||"all";if(!title||!body||(team!=="all"&&!validTeam(team)))return res.status(400).json({error:"أكمل بيانات المنشور"});db.posts.unshift({id:crypto.randomUUID(),title,body,team,date:new Date().toLocaleString("ar-EG")});save();res.json({ok:true})});
app.post("/api/admin/score",(req,res)=>{let team=req.body.team,amount=Number(req.body.amount)||0;if(!validTeam(team))return res.status(400).json({error:"فريق غير صحيح"});db.scores[team]=(db.scores[team]||0)+amount;save();res.json({ok:true,score:db.scores[team]})});
app.get("*",(req,res)=>res.sendFile(path.join(__dirname,"public/index.html")));
const port=process.env.PORT||3000;app.listen(port,()=>console.log("Galaxy Teams running on "+port));