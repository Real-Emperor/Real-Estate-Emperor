const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ datasourceUrl: process.env.DATABASE_URL });
const CID = 'company-1';

async function main() {
  const now = new Date();
  const cm = now.getMonth()+1, cy = now.getFullYear();

  console.log('1. Creating properties...');
  const b1 = await prisma.property.create({ data:{id:'prop-arj-b1',companyId:CID,name:'Emperor Tower - Building 1',nameAr:'برج الإمبراطور - المبنى 1',nameBn:'এম্পেরর টাওয়ার - ভবন ১',nameUr:'امپیرار ٹاور - عمارت 1',type:'apartment',address:'Street 5, Khalifa City A, Abu Dhabi',totalUnits:15,floors:5} });
  const b2 = await prisma.property.create({ data:{id:'prop-arj-b2',companyId:CID,name:'Emperor Tower - Building 2',nameAr:'برج الإمبراطور - المبنى 2',nameBn:'এম্পেরর টাওয়ার - ভবন ২',nameUr:'امپیرار ٹاور - عمارت 2',type:'apartment',address:'Street 7, Khalifa City A, Abu Dhabi',totalUnits:14,floors:5} });
  const b3 = await prisma.property.create({ data:{id:'prop-ram-b1',companyId:CID,name:'Emperor Heights - Building 1',nameAr:'الإمبراطور هايتس - المبنى 1',nameBn:'এম্পেরর হাইটস - ভবন ১',nameUr:'امپیرار ہائٹس - عمارت 1',type:'apartment',address:'Street 9, Khalifa City A, Abu Dhabi',totalUnits:16,floors:5} });
  const b4 = await prisma.property.create({ data:{id:'prop-ram-b2',companyId:CID,name:'Emperor Heights - Building 2',nameAr:'الإمبراطور هايتس - المبنى 2',nameBn:'এম্পেরর হাইটস - ভবন ২',nameUr:'امپیرار ہائٹس - عمارت 2',type:'mixed_use',address:'Main Road, Musaffah, Abu Dhabi',totalUnits:10,floors:4} });
  console.log('   OK - 4 properties');

  console.log('2. Creating tenants...');
  const T = (id,name,nameAr,nameBn,nameUr,phone,wa,eid,nat,emp,unit,uType,floor,sqft,rent,pm,llc,ts,pid,ls,le,cd,st) => 
    ({id,companyId:CID,propertyId:pid,name,nameAr,nameBn,nameUr,phone,whatsapp:wa,emiratesId:eid,nationality:nat,employer:emp,unitNumber:unit,unitType:uType,floor,sizeSqft:sqft,rentAmount:rent,municipalityFee:Math.round(rent*0.05),securityDeposit:rent,paymentMethod:pm,leaseStart:ls,leaseEnd:le,contractDuration:cd,status:st,latePaymentCount:llc,tenantScore:ts});
  const d=(y,m,day)=>new Date(y,m-1,day);
  const tds = [
    T('t-001','Muhammad Ali','محمد علي','মুহাম্মদ আলী','محمد علی','050-588-9844','050-588-9844','784-1990-1234567-1','Pakistani','Emirates NBD','101','studio',1,440,1800,'bank_transfer',0,97,b1.id,d(cy-1,1,1),d(cy+1,12,31),36,'active'),
    T('t-002','Ahmed Khan','أحمد خان','আহমেদ খান','احمد خان','050-501-5342','050-501-5342','784-1988-2345678-2','Pakistani','Lulu Group','102','studio',1,444,1500,'cheque',1,85,b1.id,d(cy-1,3,1),d(cy+1,2,28),24,'active'),
    T('t-003','Fatima Noor','فاطمة نور','ফাতিমা নূর','فاطمہ نور','050-295-6577','050-295-6577','784-1995-3456789-3','Syrian','Abu Dhabi Municipality','103','studio',1,448,1700,'bank_transfer',2,72,b1.id,d(cy-1,6,1),d(cy,5,30),12,'active'),
    T('t-004','Rajesh Kumar','راجيش كومار','রাজেশ কুমার','راجیش کمار','050-442-8331','050-442-8331','784-1992-4567890-4','Indian','DP World','105','studio',1,456,1600,'bank_transfer',0,98,b1.id,d(cy-1,1,1),d(cy,12,31),24,'active'),
    T('t-005','Priya Sharma','بريا شارما','প্রিয়া শর্মা','پریا شرما','050-806-8816','050-806-8816','784-1993-5678901-5','Indian','Al Futtaim Group','201','1bedroom',2,740,2800,'cash',0,100,b1.id,d(cy-1,1,1),d(cy+1,12,31),36,'active'),
    T('t-006','Omar Hassan','عمر حسن','ওমর হাসান','عمر حسن','050-606-9838','050-606-9838','784-1991-6789012-6','Jordanian','Etisalat','202','1bedroom',2,760,3000,'bank_transfer',3,55,b1.id,d(cy-1,4,1),d(cy+1,3,31),24,'active'),
    T('t-007','Youssef Ibrahim','يوسف إبراهيم','ইউসুফ ইব্রাহিম','یوسف ابراہیم','050-213-2191','050-213-2191','784-1989-7890123-7','Egyptian','Emirates Airline','203','1bedroom',2,770,2600,'bank_transfer',1,80,b1.id,d(cy-1,7,1),d(cy+1,6,30),24,'active'),
    T('t-008','Sunil Patel','سونيل باتيل','সুনীল পটেল','سنیل پٹیل','050-538-9567','050-538-9567','784-1987-8901234-8','Indian','Al Ghurair Group','301','2bedroom',3,1100,3800,'cheque',0,100,b1.id,d(cy-1,1,1),d(cy+1,12,31),36,'active'),
    T('t-009','Hassan Al Farsi','حسن الفارسي','হাসান আল ফারসি','حسن الفارسی','050-268-5177','050-268-5177','784-1985-9012345-9','Emirati','ADNOC','302','2bedroom',3,1150,4200,'bank_transfer',0,96,b1.id,d(cy-1,2,1),d(cy+2,1,31),36,'active'),
    T('t-010','Nadia Al Suwaidi','نادية السويدي','নাদিয়া আল সুওয়াইদি','نادیہ السویدی','050-778-3344','050-778-3344','784-1994-0123456-0','Emirati','Abu Dhabi Council','401','1bedroom',4,720,2500,'bank_transfer',0,99,b1.id,d(cy,1,1),d(cy+1,12,31),24,'active'),
    T('t-011','Habibur Rahman','حبيب الرحمن','হাবিবুর রহমান','حب الرحمن','050-217-6593','050-217-6593','784-1996-1122334-1','Bangladeshi','Emperor Property Services','107','studio',1,460,1400,'cash',2,70,b2.id,d(cy-1,1,1),d(cy,12,31),24,'active'),
    T('t-012','Rizwan Ahmed','رضوان أحمد','রিজওয়ান আহমেদ','رضوان احمد','050-657-2469','050-657-2469','784-1996-2233445-2','Pakistani','Etihad Airways','108','studio',1,465,1900,'bank_transfer',1,82,b2.id,d(cy-1,5,1),d(cy+1,4,30),24,'active'),
    T('t-013','Amina Khatun','أمينة خاتون','আমিনা খাতুন','امینہ خاتون','050-112-3344','050-112-3344','784-1997-3344556-3','Bangladeshi','Emirates Hospital','201','1bedroom',2,730,2400,'cash',0,100,b2.id,d(cy-1,1,1),d(cy+1,12,31),36,'active'),
    T('t-014','Nasreen Akter','نسرين أكتر','নাসরিন আক্তার','نسرین اختر','050-445-6677','050-445-6677','784-1998-4455667-4','Bangladeshi','Abu Dhabi Coop','202','1bedroom',2,750,2700,'bank_transfer',0,95,b2.id,d(cy-1,1,1),d(cy+1,12,31),36,'active'),
    T('t-015','Abdul Karim','عبد الكريم','আব্দুল করিম','عبد الکریم','050-332-8899','050-332-8899','784-1999-5566778-5','Bangladeshi','Transguard Group','203','studio',2,442,1450,'cash',0,90,b2.id,d(cy-1,7,1),d(cy+1,6,30),24,'active'),
    T('t-016','Mohammed Salem','محمد سالم','মোহাম্মদ সালেম','محمد سالم','050-887-2233','050-887-2233','784-1986-6677889-6','Emirati','Abu Dhabi Police','301','2bedroom',3,1100,4000,'cheque',0,98,b2.id,d(cy-1,1,1),d(cy+2,12,31),36,'active'),
    T('t-017','Lakshmi Devi','لاكشمي ديفي','লক্ষ্মী দেবী','لکشمی دیوی','050-554-7766','050-554-7766','784-2000-7788990-7','Indian','Mediclinic','302','1bedroom',3,700,2300,'bank_transfer',0,94,b2.id,d(cy-1,1,1),d(cy+1,12,31),36,'active'),
    T('t-018','Saeed Al Mansoori','سعيد المنصوري','সাঈদ আল মানসুরি','سعید المنصوری','050-661-4455','050-661-4455','784-1984-8899001-8','Emirati','Mubadala','303','2bedroom',3,1120,4500,'bank_transfer',0,100,b2.id,d(cy,3,1),d(cy+2,2,28),24,'active'),
    T('t-019','Kamal Hossain','كمال حسين','কমল হোসেন','کمال حسین','050-998-1122','050-998-1122','784-2001-9900112-9','Bangladeshi','Emperor Property Services','401','studio',4,440,1400,'cash',4,48,b2.id,d(cy-1,1,1),d(cy,12,31),24,'active'),
    T('t-020','Arjun Reddy','أرجون ريدي','অর্জুন রেড্ডি','ارجن ریڈی','050-258-2922','050-258-2922','784-1993-5566778-5','Indian','Tech Solutions','101','studio',1,440,2000,'bank_transfer',4,52,b3.id,d(cy-1,1,1),d(cy,12,31),24,'active'),
    T('t-021','Vikram Singh','فيكرام سينغ','বিক্রম সিং','وکرم سنگھ','050-657-2469','050-657-2469','784-1991-6677889-6','Indian','Deloitte','205','1bedroom',2,750,3200,'cheque',2,72,b3.id,d(cy-1,4,1),d(cy+1,3,31),24,'active'),
    T('t-022','Vivek Joshi','فيفيك جوشي','বিবেক জোশী','ویویک جوشی','050-708-9988','050-708-9988','784-1990-7788990-7','Indian','Mubadala','301','2bedroom',3,1100,3500,'bank_transfer',1,85,b3.id,d(cy-1,1,1),d(cy+1,12,31),36,'active'),
    T('t-023','Sanjay Verma','سنجاي فيرما','সঞ্জয় বর্মা','سنجے ورما','050-444-9647','050-444-9647','784-1992-8899001-8','Indian','Borouge','204','1bedroom',2,740,2900,'bank_transfer',0,92,b3.id,d(cy-1,1,1),d(cy+1,12,31),36,'active'),
    T('t-024','Maria Santos','ماريا سانتوس','মারিয়া সান্তোস','ماریا سانتوس','050-321-6654','050-321-6654','784-1997-9900112-9','Filipino','Abu Dhabi Airport','102','studio',1,450,1600,'cash',0,96,b3.id,d(cy-1,7,1),d(cy+1,6,30),24,'active'),
    T('t-025','Jose Reyes','خوسيه رييس','জোসে রেয়েস','جوز ریس','050-789-3321','050-789-3321','784-1998-0011223-0','Filipino','Etihad Airways','206','1bedroom',2,720,2500,'bank_transfer',0,90,b3.id,d(cy-1,1,1),d(cy+1,12,31),36,'active'),
    T('t-026','Khalid Al Ameri','خالد العميري','খালিদ আল আমেরি','خالد العمیری','050-423-5566','050-423-5566','784-1983-1122334-1','Emirati','ADNOC','302','2bedroom',3,1080,3800,'bank_transfer',0,97,b3.id,d(cy-1,2,1),d(cy+2,1,31),36,'active'),
    T('t-027','Tariq Mahmoud','طارق محمود','তারিক মাহমুদ','طارق محمود','050-556-7788','050-556-7788','784-1994-2233445-2','Sudanese','Al Dar Properties','303','1bedroom',3,735,2800,'cash',1,78,b3.id,d(cy-1,9,1),d(cy+1,8,31),24,'active'),
    T('t-028','Bishnu Prasad','بشنو براساد','বিষ্ণু প্রসাদ','وشنو پرساد','050-234-8899','050-234-8899','784-2002-3344556-3','Nepali','Emperor Property Services','401','studio',4,438,1500,'cash',0,88,b3.id,d(cy-1,1,1),d(cy,12,31),24,'notice'),
    T('t-029','Walid Al Zaabi','وليد الزعابي','ওয়ালিদ আল জাবি','ولید الزعابی','050-306-3183','050-306-3183','784-1988-9900112-9','Emirati','AD Police','103','studio',1,445,1800,'cheque',1,80,b4.id,d(cy-1,1,1),d(cy+1,12,31),36,'active'),
    T('t-030','Sultan Al Darmaki','سلطان الدرمكي','সুলতান আল দারমাকি','سلطان الدارمکی','050-712-1575','050-712-1575','784-1986-0011223-0','Emirati','Abu Dhabi Council','203','1bedroom',2,720,3100,'bank_transfer',2,68,b4.id,d(cy-1,1,1),d(cy,12,31),24,'active'),
    T('t-031','Emperor Grocery','بقالة الإمبراطور','এম্পেরর গ্রোসারি','امپیرار گروسری','050-123-4567','050-123-4567','784-2000-1122334-1','Yemeni','Self-employed','Shop1','shop',1,500,4000,'cash',0,90,b4.id,d(cy-1,1,1),d(cy+1,12,31),36,'active'),
    T('t-032','Al Noor Tailoring','خياطة النور','আল নূর টেইলারিং','النور درزی','050-876-5432','050-876-5432','784-2001-2233445-2','Indian','Self-employed','Shop2','shop',1,420,3500,'cash',0,85,b4.id,d(cy-1,4,1),d(cy+1,3,31),24,'active'),
    T('t-033','Deepak Thapa','ديباك ثابا','দীপক থাপা','دیپک تھاپا','050-678-9900','050-678-9900','784-2003-4455667-4','Nepali','Emperor Property Services','104','studio',1,440,1400,'cash',0,86,b4.id,d(cy-1,1,1),d(cy,12,31),24,'active'),
    T('t-034','Farida Begum','فريدة بيغوم','ফরিদা বেগম','فریدہ بیگم','050-432-1100','050-432-1100','784-2004-5566778-5','Bangladeshi','Emirates Palace','204','1bedroom',2,710,2200,'cash',0,93,b4.id,d(cy-1,1,1),d(cy+1,12,31),36,'active'),
    T('t-035','Imran Malik','عمران مالك','ইমরান মালিক','عمران ملک','050-987-6543','050-987-6543','784-1995-6677889-6','Pakistani','Emirates Steel','205','1bedroom',2,730,2600,'bank_transfer',3,42,b4.id,d(cy-1,1,1),d(cy,12,31),24,'active'),
    T('t-036','Ahmed Al Qubaisi','أحمد القبيسي','আহমেদ আল কুবাইসি','احمد القبیسی','050-345-2211','050-345-2211','784-1982-7788990-7','Emirati','Government Entity','303','2bedroom',3,1090,3600,'bank_transfer',0,99,b4.id,d(cy,1,1),d(cy+2,12,31),36,'inactive'),
  ];
  const tenants = [];
  for (const t of tds) { tenants.push(await prisma.tenant.create({data:t})); }
  console.log('   OK - '+tenants.length+' tenants');

  console.log('3. Creating payments (8 months)...');
  const M=['cash','bank_transfer','cheque'];
  const ov0=[2,5,14,19,34],pa0=[{i:6,a:1500},{i:29,a:1000}],ad0=[4,8,15],ov1=[5,14,19],ov2=[2,19],mp=[6,29,1];
  let pc=0;
  for(let mo=0;mo<8;mo++){let pm=cm-mo,py=cy;if(pm<=0){pm+=12;py--;}
  for(let i=0;i<tenants.length;i++){const t=tenants[i];if(t.status!=='active')continue;
  if(mo===0){if(ov0.includes(i))continue;const pi=pa0.find(p=>p.i===i);if(pi){await prisma.payment.create({data:{tenantId:t.id,amount:pi.a,date:new Date(py,pm-1,3),month:pm,year:py,method:'bank_transfer',reference:'RCP-'+pm+py+'-'+t.unitNumber,isLate:false,daysLate:0}});pc++;continue;}
  if(ad0.includes(i)){const nm=pm===12?1:pm+1,ny=pm===12?py+1:py;await prisma.payment.create({data:{tenantId:t.id,amount:t.rentAmount,date:new Date(py,pm-1,1),month:pm,year:py,method:M[Math.floor(Math.random()*3)],reference:'RCP-'+pm+py+'-'+t.unitNumber,isLate:false,daysLate:0}});await prisma.payment.create({data:{tenantId:t.id,amount:t.rentAmount,date:new Date(py,pm-1,1),month:nm,year:ny,method:M[Math.floor(Math.random()*3)],reference:'ADV-'+nm+ny+'-'+t.unitNumber,isLate:false,daysLate:0,notes:'Advance payment'}});pc+=2;continue;}}
  if(mo===1&&ov1.includes(i))continue;if(mo===2&&ov2.includes(i))continue;
  const il=mo>0&&Math.random()<0.12;const dl=il?Math.floor(Math.random()*15)+1:0;
  if(mp.includes(i)&&mo>0&&mo<5){const hr=Math.round(t.rentAmount/2);await prisma.payment.create({data:{tenantId:t.id,amount:hr,date:new Date(py,pm-1,il?12:2),month:pm,year:py,method:'cash',reference:'RCP-'+pm+py+'-'+t.unitNumber+'-1',isLate:il,daysLate:il?dl:0}});await prisma.payment.create({data:{tenantId:t.id,amount:t.rentAmount-hr,date:new Date(py,pm-1,il?18:5),month:pm,year:py,method:'bank_transfer',reference:'RCP-'+pm+py+'-'+t.unitNumber+'-2',isLate:il,daysLate:il?dl+3:0}});pc+=2;continue;}
  await prisma.payment.create({data:{tenantId:t.id,amount:t.rentAmount,date:new Date(py,pm-1,il?Math.floor(Math.random()*15)+10:Math.floor(Math.random()*5)+1),month:pm,year:py,method:M[Math.floor(Math.random()*3)],reference:'RCP-'+pm+py+'-'+t.unitNumber,isLate:il,daysLate:dl}});pc++;}}
  console.log('   OK - '+pc+' payments');

  console.log('4. Creating expenses...');
  const exs=[
    {c:'manpower',d:'Building security - monthly',a:12000,v:'SafeGuard Security',i:'INV-2001',r:true,b:'All Buildings'},
    {c:'manpower',d:'Building cleaners - monthly',a:8000,v:'CleanPro Services',i:'INV-2002',r:true,b:'All Buildings'},
    {c:'manpower',d:'Maintenance staff - monthly',a:15000,v:'Emperor Property Services',i:'INV-2003',r:true,b:'All Buildings'},
    {c:'manpower',d:'Reception staff - monthly',a:6000,v:'Emperor Property Services',i:'INV-2005',r:true,b:'All Buildings'},
    {c:'municipality',d:'Q1 Municipality fees',a:8500,v:'Abu Dhabi Municipality',i:'MUN-0125',r:true,b:'All Buildings'},
    {c:'municipality',d:'Q2 Municipality fees',a:8500,v:'Abu Dhabi Municipality',i:'MUN-0225',r:true,b:'All Buildings'},
    {c:'utilities',d:'Electricity - March',a:5500,v:'ADDC',i:'ADDC-3301',r:true,b:'All Buildings'},
    {c:'utilities',d:'Water bill - March',a:3000,v:'ADDC',i:'ADDC-3302',r:true,b:'All Buildings'},
    {c:'utilities',d:'Electricity - February',a:5200,v:'ADDC',i:'ADDC-3201',r:true,b:'All Buildings'},
    {c:'utilities',d:'Chiller charges - March',a:4500,v:'Tabreed',i:'TAB-4401',r:true,b:'All Buildings'},
    {c:'utilities',d:'Gas supply - March',a:1200,v:'ADNOC Gas',i:'GAS-5501',r:true,b:'All Buildings'},
    {c:'maintenance',d:'AC repair B-108',a:380,v:'CoolTech Services',i:'INV-2010',r:false,b:'Emperor Tower - Building 2'},
    {c:'maintenance',d:'Elevator maintenance - Emperor Tower Bldg 1',a:1800,v:'Schindler Elevators',i:'INV-2030',r:true,b:'Emperor Tower - Building 1'},
    {c:'maintenance',d:'Painting - Hallway Emperor Tower Bldg 1',a:3200,v:'ColorPro Painters',i:'INV-2031',r:false,b:'Emperor Tower - Building 1'},
    {c:'maintenance',d:'Plumbing repair - Emperor Heights Bldg 1',a:750,v:'Al Fix Plumbing',i:'INV-2040',r:false,b:'Emperor Heights - Building 1'},
    {c:'maintenance',d:'Elevator maintenance - Emperor Heights Bldg 1',a:1600,v:'Schindler Elevators',i:'INV-2032',r:true,b:'Emperor Heights - Building 1'},
    {c:'maintenance',d:'Elevator maintenance - Emperor Heights Bldg 2',a:1500,v:'Schindler Elevators',i:'INV-2033',r:true,b:'Emperor Heights - Building 2'},
    {c:'maintenance',d:'Elevator maintenance - Emperor Tower Bldg 2',a:1700,v:'Schindler Elevators',i:'INV-2034',r:true,b:'Emperor Tower - Building 2'},
    {c:'leasing',d:'Leasing commission - 2 new tenants',a:4600,v:'Emperor Leasing',i:'INV-2020',r:false,b:'All Buildings'},
    {c:'insurance',d:'Building insurance Q2',a:2800,v:'Oman Insurance',i:'POL-4455',r:true,b:'All Buildings'},
    {c:'insurance',d:'Building insurance Q1',a:2800,v:'Oman Insurance',i:'POL-4450',r:true,b:'All Buildings'},
    {c:'security',d:'CCTV monitoring - March',a:6000,v:'SafeGuard Security',i:'INV-2004',r:true,b:'All Buildings'},
    {c:'salary',d:'Office staff salaries - March',a:25000,v:'Internal',i:'SAL-0301',r:true,b:'All Buildings'},
    {c:'salary',d:'Office staff salaries - February',a:25000,v:'Internal',i:'SAL-0201',r:true,b:'All Buildings'},
    {c:'maintenance',d:'Roof waterproofing - Emperor Heights Bldg 2',a:8500,v:'WaterShield LLC',i:'INV-2050',r:false,b:'Emperor Heights - Building 2'},
    {c:'maintenance',d:'Parking lot repainting - Emperor Heights Bldg 2',a:2800,v:'ColorPro Painters',i:'INV-2051',r:false,b:'Emperor Heights - Building 2'},
    {c:'utilities',d:'Emergency generator fuel - Feb',a:2200,v:'ADNOC Distribution',i:'ADNOC-G01',r:false,b:'All Buildings'},
  ];
  for(const e of exs){await prisma.expense.create({data:{companyId:CID,category:e.c,description:e.d,amount:e.a,date:new Date(cy,cm-2,15),vendor:e.v,invoiceNumber:e.i,recurring:e.r,building:e.b}});}
  console.log('   OK - '+exs.length+' expenses');

  console.log('5. Creating maintenance items...');
  const mts=[
    {t:'AC Compressor Replacement - Unit 202',d:'AC compressor failed. No cooling for 3 days.',c:'ac',v:'CoolTech Services',p:'urgent',s:'in-progress',e:3500,a:null,pi:b1.id},
    {t:'Water Leak - Unit 108',d:'Water leaking from ceiling. Possible roof damage.',c:'plumbing',v:'Al Fix Plumbing',p:'high',s:'pending',e:2000,a:null,pi:b2.id},
    {t:'Elevator Inspection - Emperor Tower Bldg 1',d:'Annual elevator inspection and certification.',c:'other',v:'Schindler Elevators',p:'medium',s:'pending',e:1500,a:null,pi:b1.id},
    {t:'Parking Lot Repainting - Emperor Heights Bldg 2',d:'Parking lines faded. Needs repainting.',c:'painting',v:'ColorPro Painters',p:'low',s:'completed',e:3000,a:2800,pi:b4.id},
    {t:'Door Lock Replacement - Unit 204',d:'Tenant requested new lock for security.',c:'lock_door',v:'KeyMaster LLC',p:'medium',s:'completed',e:150,a:180,pi:b3.id},
    {t:'Intercom System Repair - Emperor Tower Bldg 2',d:'Intercom not working.',c:'electrical',v:'SafeWire Electric',p:'high',s:'in-progress',e:1800,a:null,pi:b2.id},
    {t:'Fire Extinguisher Replacement - Emperor Tower Bldg 1',d:'Annual fire extinguisher replacement.',c:'other',v:'FirePro Safety',p:'medium',s:'pending',e:900,a:null,pi:b1.id},
    {t:'Kitchen Pipe Blockage - Unit 303',d:'Kitchen drain blocked.',c:'plumbing',v:'Al Fix Plumbing',p:'high',s:'in-progress',e:500,a:null,pi:b4.id},
    {t:'AC Filter Cleaning - Emperor Heights Bldg 1',d:'Quarterly AC filter cleaning.',c:'ac',v:'CoolTech Services',p:'low',s:'completed',e:800,a:750,pi:b3.id},
    {t:'Staircase Lighting - Emperor Tower Bldg 2',d:'Staircase lights not working floors 3-5.',c:'electrical',v:'SafeWire Electric',p:'medium',s:'pending',e:400,a:null,pi:b2.id},
    {t:'Roof Waterproofing - Emperor Heights Bldg 2',d:'Water seepage on top floor.',c:'structural',v:'WaterShield LLC',p:'high',s:'pending',e:8000,a:null,pi:b4.id},
    {t:'AC Gas Refill - Unit 205',d:'AC not cooling. Gas refill needed.',c:'ac',v:'CoolTech Services',p:'medium',s:'pending',e:600,a:null,pi:b3.id},
  ];
  for(const m of mts){await prisma.maintenance.create({data:{companyId:CID,title:m.t,description:m.d,category:m.c,vendor:m.v,priority:m.p,status:m.s,estimatedCost:m.e,actualCost:m.a,propertyId:m.pi,createdAt:new Date(cy,cm-2,10),completedAt:m.s==='completed'?new Date(cy,cm-1,5):null}});}
  console.log('   OK - '+mts.length+' maintenance items');

  console.log('\n=== VERIFICATION ===');
  const fp=await prisma.property.findMany({where:{deletedAt:null},select:{name:true}});
  console.log('Properties:',fp.map(p=>p.name).join(', '));
  console.log('Tenants:',await prisma.tenant.count({where:{deletedAt:null}}));
  const fr=await prisma.tenant.aggregate({_min:{rentAmount:true},_max:{rentAmount:true}});
  console.log('Rent range:',fr._min.rentAmount,'-',fr._max.rentAmount,'AED');
  console.log('Payments:',await prisma.payment.count());
  console.log('Expenses:',await prisma.expense.count({where:{deletedAt:null}}));
  console.log('Maintenance:',await prisma.maintenance.count({where:{deletedAt:null}}));
  const oor=await prisma.tenant.count({where:{deletedAt:null,OR:[{rentAmount:{lt:1400}},{rentAmount:{gt:4500}}]}});
  console.log('Outside 1400-4500 AED range:',oor);
  await prisma.$disconnect();
  console.log('\nDONE!');
}
main().catch(e=>{console.error('FAILED:',e.message);process.exit(1);});
