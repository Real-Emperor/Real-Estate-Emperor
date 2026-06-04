/**
 * Import real property & tenant data from Excel into production database.
 * 
 * Source: 2026 date villa.xlsx
 * - 26 Properties
 * - 414 Units (363 tenanted, 51 vacant)
 * - Total monthly rent: ~702,481 AED
 * 
 * Run: node scripts/import-real-data.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasourceUrl: 'postgresql://neondb_owner:npg_wB1fOmTSF0ji@ep-still-sound-abnl454x.eu-west-2.aws.neon.tech/neondb?sslmode=require'
});

const COMPANY_ID = 'company-1';
const PLACEHOLDER_PHONE = '000-000-0000';

// Property type mapping based on names
const PROPERTY_TYPE_MAP = {
  '(New) Al Ain Mall': 'mixed_use',
  '(Old) Al Ain Mall': 'mixed_use',
  'Al Bateen Villa': 'villa',
  'Al Diwan Villa': 'villa',
  'Habooy New': 'villa',
  'Habooy Villa': 'villa',
  'India House': 'apartment',
  'Jahili New': 'apartment',
  'Jahili Villa': 'villa',
  'Al Khabessi': 'apartment',
  'Khalifa Villa': 'villa',
  'Manaseer Villa': 'villa',
  'Al Maqam Villa': 'villa',
  'Matowa': 'villa',
  'Al Mutarid Villa': 'villa',
  'Neima New': 'apartment',
  'Neima Villa': 'villa',
  'New Office': 'office',
  'Al Niyadat New': 'apartment',
  'Al Niyadat Old': 'apartment',
  'Salhie Villa': 'villa',
  'Al Sinayaa Building': 'mixed_use',
  'Al Sarooj Villa': 'villa',
  'Sumali Villa': 'villa',
  'Zafrana Villa': 'villa',
  'Zakher Building': 'apartment',
};

// Unit type inference based on property type and unit numbering
function inferUnitType(propertyName, unitNumber, propertyType) {
  const uNum = String(unitNumber).toUpperCase();
  
  // Office building
  if (propertyType === 'office' || uNum.includes('OFFICE')) return 'office';
  
  // Shops
  if (uNum.includes('SHOP') || uNum.includes('GARAGE')) return 'shop';
  
  // Villas typically have bedroom-style units
  if (propertyType === 'villa') {
    // Units like A1, B1, C1 in villas are often studio/1bedroom
    if (/^[A-Z]\d+$/.test(uNum)) return '1bedroom';
    return 'studio'; // small villa rooms
  }
  
  // Apartments / mixed_use
  if (propertyType === 'apartment' || propertyType === 'mixed_use') {
    return 'studio'; // default for apartment buildings
  }
  
  return 'studio';
}

// Parse Excel data manually (since we know the structure)
// Column A: Property Name, B: Unit Number, C: Tenant Name, D: Rent Amount
const EXCEL_DATA = [
  // (New) Al Ain Mall
  { prop: '(New) Al Ain Mall', unit: '1', tenant: 'AHMED MOHAMED SAYEED ALI', rent: 1400 },
  { prop: '(New) Al Ain Mall', unit: '2', tenant: 'YASSINE MARKIK', rent: 1550 },
  { prop: '(New) Al Ain Mall', unit: '3', tenant: 'THI DIEM QUYNH TRAN', rent: 2500 },
  { prop: '(New) Al Ain Mall', unit: '4', tenant: 'HASSANAIN', rent: 2500 },
  { prop: '(New) Al Ain Mall', unit: '5', tenant: 'SANAE EL AZSSASSI', rent: 1500 },
  { prop: '(New) Al Ain Mall', unit: '6', tenant: 'AHMED', rent: 1500 },
  { prop: '(New) Al Ain Mall', unit: '7', tenant: 'ABDUL FATHAH MOHAMED ABDU RAHIMAN CHAKKAYIL MOHAMED', rent: 1500 },
  { prop: '(New) Al Ain Mall', unit: '8', tenant: 'KINJA(NEW)', rent: 1500 },
  { prop: '(New) Al Ain Mall', unit: '9', tenant: 'MERYEME LAGHLID(1550)', rent: 1400 },
  { prop: '(New) Al Ain Mall', unit: '10', tenant: 'ADNAN BACHIR ALYOUB', rent: 2500 },

  // (Old) Al Ain Mall
  { prop: '(Old) Al Ain Mall', unit: '1', tenant: 'Malak El Dannawi', rent: 1500 },
  { prop: '(Old) Al Ain Mall', unit: '2', tenant: 'KHAWSER', rent: 1600 },
  { prop: '(Old) Al Ain Mall', unit: '3', tenant: 'Shadia Nabaasa', rent: 2400 },
  { prop: '(Old) Al Ain Mall', unit: '4', tenant: 'MICHELLE', rent: 1700 },
  { prop: '(Old) Al Ain Mall', unit: '5', tenant: 'ILHAM', rent: 1800 },
  { prop: '(Old) Al Ain Mall', unit: '6', tenant: 'HALA', rent: 2350 },
  { prop: '(Old) Al Ain Mall', unit: '7', tenant: 'INDIAN', rent: 1600 },
  { prop: '(Old) Al Ain Mall', unit: '8', tenant: 'HIBA', rent: 1600 },
  { prop: '(Old) Al Ain Mall', unit: '9', tenant: 'MAYA', rent: 1200 },
  { prop: '(Old) Al Ain Mall', unit: '10', tenant: 'KOKO', rent: 2000 },
  { prop: '(Old) Al Ain Mall', unit: '11', tenant: 'SUBAIR', rent: 1600 },
  { prop: '(Old) Al Ain Mall', unit: '12', tenant: 'HANY', rent: 1700 },
  { prop: '(Old) Al Ain Mall', unit: '13A', tenant: 'CONKON', rent: 1000 },
  { prop: '(Old) Al Ain Mall', unit: '13B', tenant: 'JISHA', rent: 1000 },
  { prop: '(Old) Al Ain Mall', unit: '14', tenant: 'JONAID K.P', rent: 2800 },
  { prop: '(Old) Al Ain Mall', unit: '16', tenant: null, rent: 1500 },  // vacant
  { prop: '(Old) Al Ain Mall', unit: '17', tenant: 'LINDA', rent: 1200 },
  { prop: '(Old) Al Ain Mall', unit: '15', tenant: 'IMANE', rent: 2400 },

  // Al Bateen Villa
  { prop: 'Al Bateen Villa', unit: 'C10', tenant: 'MOHHAMED', rent: 1000 },
  { prop: 'Al Bateen Villa', unit: 'A1', tenant: 'SAMI', rent: 1100 },
  { prop: 'Al Bateen Villa', unit: 'A2', tenant: 'NOUSIRI', rent: 1150 },
  { prop: 'Al Bateen Villa', unit: 'A3', tenant: 'KHAIRUL TAILOR', rent: 1580 },
  { prop: 'Al Bateen Villa', unit: 'A4', tenant: 'AHMD', rent: 1200 },
  { prop: 'Al Bateen Villa', unit: 'A5', tenant: 'MOHD', rent: 1100 },
  { prop: 'Al Bateen Villa', unit: 'A6', tenant: 'AYHAM ADEL AMER', rent: 2100 },
  { prop: 'Al Bateen Villa', unit: 'B1', tenant: 'TAMIM', rent: 1800 },
  { prop: 'Al Bateen Villa', unit: 'B2', tenant: 'KHAIRUL TAILOR', rent: 1000 },
  { prop: 'Al Bateen Villa', unit: 'B3', tenant: 'SHADI', rent: 1200 },
  { prop: 'Al Bateen Villa', unit: 'B4', tenant: 'KHAIRUL TAILOR', rent: 1100 },
  { prop: 'Al Bateen Villa', unit: 'B6', tenant: 'SAJID HUSSAIN', rent: 2000 },
  { prop: 'Al Bateen Villa', unit: 'B7', tenant: 'TISOTSOE OSAMA', rent: 1800 },
  { prop: 'Al Bateen Villa', unit: 'B8', tenant: 'SHINE', rent: 1500 },
  { prop: 'Al Bateen Villa', unit: 'C1', tenant: 'MOHAMMED', rent: 2300 },
  { prop: 'Al Bateen Villa', unit: 'C2', tenant: 'NIAMUTULLAH', rent: 1700 },
  { prop: 'Al Bateen Villa', unit: 'C3', tenant: 'BALA', rent: 1500 },
  { prop: 'Al Bateen Villa', unit: 'C4', tenant: 'RENJI', rent: 1800 },
  { prop: 'Al Bateen Villa', unit: 'C5', tenant: 'MUSTAFA', rent: 1700 },
  { prop: 'Al Bateen Villa', unit: 'C6', tenant: 'SUBAIR', rent: 1800 },
  { prop: 'Al Bateen Villa', unit: 'C7', tenant: 'MOHAMED', rent: 2000 },
  { prop: 'Al Bateen Villa', unit: 'C8', tenant: 'SHUAIB P.K', rent: 1500 },
  { prop: 'Al Bateen Villa', unit: 'C9', tenant: 'NIAMUTULLAH', rent: 1500 },

  // Al Diwan Villa
  { prop: 'Al Diwan Villa', unit: '1', tenant: 'AHMED ELHAB', rent: 1700 },
  { prop: 'Al Diwan Villa', unit: '2', tenant: 'MOHAMMAD', rent: 2700 },
  { prop: 'Al Diwan Villa', unit: '3', tenant: 'AHMED', rent: 3000 },
  { prop: 'Al Diwan Villa', unit: '4', tenant: 'NABI MOHD', rent: 2000 },
  { prop: 'Al Diwan Villa', unit: '5', tenant: 'MR SHINTO', rent: 3000 },
  { prop: 'Al Diwan Villa', unit: '6', tenant: 'AHMED', rent: 3300 },
  { prop: 'Al Diwan Villa', unit: '7', tenant: 'MOHAMMAD', rent: 3000 },
  { prop: 'Al Diwan Villa', unit: '8', tenant: 'ATIF MOHD', rent: 800 },

  // Habooy New
  { prop: 'Habooy New', unit: 'A1', tenant: 'KUMAR', rent: 2400 },
  { prop: 'Habooy New', unit: 'A2', tenant: 'RAJIR', rent: 2000 },
  { prop: 'Habooy New', unit: 'A3', tenant: 'RAMI HOSSAIN', rent: 2700 },
  { prop: 'Habooy New', unit: 'A4', tenant: 'ADEL', rent: 1750 },
  { prop: 'Habooy New', unit: 'A5', tenant: null, rent: 2600 },  // vacant
  { prop: 'Habooy New', unit: 'A6', tenant: 'TAHER', rent: 2600 },
  { prop: 'Habooy New', unit: 'B1', tenant: 'ZAINAB', rent: 2700 },
  { prop: 'Habooy New', unit: 'B2', tenant: 'HAMDAN', rent: 2600 },
  { prop: 'Habooy New', unit: 'B3', tenant: 'RABIYA', rent: 1600 },
  { prop: 'Habooy New', unit: 'B4', tenant: 'FATEMA', rent: 2700 },
  { prop: 'Habooy New', unit: 'B5', tenant: 'MOROCO Z', rent: 2600 },
  { prop: 'Habooy New', unit: 'B6', tenant: 'SURI', rent: 1900 },

  // Habooy Villa
  { prop: 'Habooy Villa', unit: '1', tenant: 'VIPIN KUMAR', rent: 3000 },
  { prop: 'Habooy Villa', unit: '2', tenant: 'GUS', rent: 2800 },
  { prop: 'Habooy Villa', unit: '3', tenant: 'FORKAN', rent: 2800 },
  { prop: 'Habooy Villa', unit: '4', tenant: null, rent: 3000 },  // vacant
  { prop: 'Habooy Villa', unit: '5', tenant: 'AHMED', rent: 3200 },
  { prop: 'Habooy Villa', unit: '6', tenant: 'FAHAD MON', rent: 3000 },
  { prop: 'Habooy Villa', unit: '7', tenant: 'FRID', rent: 3200 },
  { prop: 'Habooy Villa', unit: '8', tenant: 'EEIN', rent: 2916 },
  { prop: 'Habooy Villa', unit: 'A6', tenant: null, rent: 2600 },  // vacant
  { prop: 'Habooy Villa', unit: 'A7', tenant: null, rent: 3800 },  // vacant
  { prop: 'Habooy Villa', unit: 'A8', tenant: null, rent: 1500 },  // vacant
  { prop: 'Habooy Villa', unit: 'A9', tenant: null, rent: 1500 },  // vacant
  { prop: 'Habooy Villa', unit: '9', tenant: 'MONHAN', rent: 3000 },
  { prop: 'Habooy Villa', unit: '10', tenant: 'JAWROJ', rent: 3000 },
  { prop: 'Habooy Villa', unit: '11', tenant: 'NAVAS', rent: 3000 },
  { prop: 'Habooy Villa', unit: 'A1', tenant: null, rent: 3333 },  // vacant
  { prop: 'Habooy Villa', unit: 'A2', tenant: null, rent: 3300 },  // vacant
  { prop: 'Habooy Villa', unit: 'A3', tenant: null, rent: 1700 },  // vacant
  { prop: 'Habooy Villa', unit: 'A4', tenant: null, rent: 2000 },  // vacant
  { prop: 'Habooy Villa', unit: 'A5', tenant: 'LENNETTE P', rent: 2700 },

  // India House
  { prop: 'India House', unit: '1', tenant: 'THOMAS', rent: 1750 },
  { prop: 'India House', unit: '2', tenant: 'AHSAN', rent: 1500 },
  { prop: 'India House', unit: '3', tenant: 'ONIK KAJOL', rent: 1600 },
  { prop: 'India House', unit: '4', tenant: 'OJIT', rent: 1700 },
  { prop: 'India House', unit: '5', tenant: 'OSMAN', rent: 1600 },
  { prop: 'India House', unit: '6', tenant: 'ZAHID', rent: 2000 },
  { prop: 'India House', unit: '7', tenant: 'OMANI', rent: 700 },
  { prop: 'India House', unit: '8', tenant: 'BULDAN', rent: 1750 },
  { prop: 'India House', unit: '9', tenant: 'BULDAN STAP', rent: 1400 },
  { prop: 'India House', unit: '10', tenant: 'ARIF', rent: 1600 },
  { prop: 'India House', unit: '11', tenant: 'NIHAL', rent: 1600 },
  { prop: 'India House', unit: '12', tenant: 'CALUCAT', rent: 1400 },
  { prop: 'India House', unit: '13', tenant: 'MOHAD', rent: 1600 },
  { prop: 'India House', unit: '14', tenant: 'MUBARAK', rent: 1500 },
  { prop: 'India House', unit: '15', tenant: 'FOR LINE', rent: 1600 },
  { prop: 'India House', unit: '16', tenant: 'SALEEM', rent: 1850 },
  { prop: 'India House', unit: '17', tenant: 'SHAMSUDDIN', rent: 3000 },
  { prop: 'India House', unit: '18', tenant: 'NISHAD', rent: 3600 },
  { prop: 'India House', unit: '19', tenant: 'TAHER', rent: 2200 },
  { prop: 'India House', unit: '20', tenant: 'RATHEES', rent: 1850 },
  { prop: 'India House', unit: '21', tenant: 'ALI', rent: 1400 },
  { prop: 'India House', unit: 'S-2', tenant: 'LONDRY', rent: 1800 },
  { prop: 'India House', unit: 'S-1', tenant: 'REDWAN', rent: 1000 },
  { prop: 'India House', unit: 'A', tenant: 'ADNOC', rent: 1900 },
  { prop: 'India House', unit: 'B', tenant: 'ROMAN', rent: 1800 },
  { prop: 'India House', unit: 'C', tenant: 'PILO', rent: 1700 },
  { prop: 'India House', unit: 'D', tenant: 'LOTIF', rent: 1700 },
  { prop: 'India House', unit: 'E', tenant: 'HITAM', rent: 1800 },
  { prop: 'India House', unit: 'F', tenant: 'STRUTI', rent: 1800 },
  { prop: 'India House', unit: 'G', tenant: 'AMIER', rent: 2000 },
  { prop: 'India House', unit: 'H', tenant: 'PILIPO', rent: 1600 },

  // Jahili New
  { prop: 'Jahili New', unit: '1', tenant: 'ABDUL AZIZ', rent: 1600 },
  { prop: 'Jahili New', unit: '2', tenant: 'HAKIM', rent: 1600 },
  { prop: 'Jahili New', unit: '3', tenant: 'MOMEN', rent: 1600 },
  { prop: 'Jahili New', unit: '4', tenant: 'SIJIN', rent: 1800 },
  { prop: 'Jahili New', unit: '5', tenant: 'AHMED', rent: 3200 },
  { prop: 'Jahili New', unit: '6', tenant: 'MUSTAFA MOHD', rent: 3500 },

  // Jahili Villa
  { prop: 'Jahili Villa', unit: '1', tenant: 'IBTESAM', rent: 1500 },
  { prop: 'Jahili Villa', unit: '2', tenant: 'SIVA KUMAR', rent: 2150 },
  { prop: 'Jahili Villa', unit: '3', tenant: 'MOHD YASIN', rent: 3200 },
  { prop: 'Jahili Villa', unit: '4', tenant: 'QASEM', rent: 2200 },
  { prop: 'Jahili Villa', unit: '5', tenant: 'FIROJ', rent: 1700 },
  { prop: 'Jahili Villa', unit: '6', tenant: 'NAJAT', rent: 3000 },
  { prop: 'Jahili Villa', unit: '7', tenant: 'ISMAIL', rent: 1700 },
  { prop: 'Jahili Villa', unit: '8', tenant: 'MAJEN', rent: 2920 },
  { prop: 'Jahili Villa', unit: '9', tenant: 'SHORIF ADEL', rent: 3000 },
  { prop: 'Jahili Villa', unit: '10', tenant: 'MARIUF AIF', rent: 2000 },
  { prop: 'Jahili Villa', unit: '11', tenant: 'AHMED', rent: 1400 },
  { prop: 'Jahili Villa', unit: '12', tenant: 'IBRAHIM TABOOK', rent: 1500 },
  { prop: 'Jahili Villa', unit: '13', tenant: 'ABED', rent: 2500 },

  // Al Khabessi (all 34 units vacant)
  { prop: 'Al Khabessi', unit: '1', tenant: null, rent: null },
  { prop: 'Al Khabessi', unit: '2', tenant: null, rent: null },
  { prop: 'Al Khabessi', unit: '3', tenant: null, rent: null },
  { prop: 'Al Khabessi', unit: '4', tenant: null, rent: null },
  { prop: 'Al Khabessi', unit: '5', tenant: null, rent: null },
  { prop: 'Al Khabessi', unit: '6', tenant: null, rent: null },
  { prop: 'Al Khabessi', unit: '7', tenant: null, rent: null },
  { prop: 'Al Khabessi', unit: '8', tenant: null, rent: null },
  { prop: 'Al Khabessi', unit: '9', tenant: null, rent: null },
  { prop: 'Al Khabessi', unit: '10', tenant: null, rent: null },
  { prop: 'Al Khabessi', unit: '11', tenant: null, rent: null },
  { prop: 'Al Khabessi', unit: '12', tenant: null, rent: null },
  { prop: 'Al Khabessi', unit: '13', tenant: null, rent: null },
  { prop: 'Al Khabessi', unit: '14', tenant: null, rent: null },
  { prop: 'Al Khabessi', unit: '15', tenant: null, rent: null },
  { prop: 'Al Khabessi', unit: '16', tenant: null, rent: null },
  { prop: 'Al Khabessi', unit: '17', tenant: null, rent: null },
  { prop: 'Al Khabessi', unit: '18', tenant: null, rent: null },
  { prop: 'Al Khabessi', unit: '19', tenant: null, rent: null },
  { prop: 'Al Khabessi', unit: '20', tenant: null, rent: null },
  { prop: 'Al Khabessi', unit: '21', tenant: null, rent: null },
  { prop: 'Al Khabessi', unit: '22', tenant: null, rent: null },
  { prop: 'Al Khabessi', unit: '23', tenant: null, rent: null },
  { prop: 'Al Khabessi', unit: '24', tenant: null, rent: null },
  { prop: 'Al Khabessi', unit: '25', tenant: null, rent: null },
  { prop: 'Al Khabessi', unit: '26', tenant: null, rent: null },
  { prop: 'Al Khabessi', unit: '27', tenant: null, rent: null },
  { prop: 'Al Khabessi', unit: '28', tenant: null, rent: null },
  { prop: 'Al Khabessi', unit: '29', tenant: null, rent: null },
  { prop: 'Al Khabessi', unit: '30', tenant: null, rent: null },
  { prop: 'Al Khabessi', unit: '31', tenant: null, rent: null },
  { prop: 'Al Khabessi', unit: '32', tenant: null, rent: null },
  { prop: 'Al Khabessi', unit: '33', tenant: null, rent: null },
  { prop: 'Al Khabessi', unit: '34', tenant: null, rent: null },

  // Khalifa Villa
  { prop: 'Khalifa Villa', unit: '1', tenant: 'ESSAM AMASA', rent: 1700 },
  { prop: 'Khalifa Villa', unit: '2', tenant: 'WAEL HASAN', rent: 1200 },
  { prop: 'Khalifa Villa', unit: '3', tenant: 'MASUD', rent: 1200 },
  { prop: 'Khalifa Villa', unit: '4', tenant: 'BASYUNI/ADNAN', rent: 1600 },
  { prop: 'Khalifa Villa', unit: '5', tenant: 'OMER KHAN', rent: 2600 },
  { prop: 'Khalifa Villa', unit: '6', tenant: 'MRS TEETAA', rent: 1000 },
  { prop: 'Khalifa Villa', unit: '7', tenant: 'IQBAL', rent: 1800 },
  { prop: 'Khalifa Villa', unit: '8', tenant: 'MRS DOUNIA', rent: 950 },
  { prop: 'Khalifa Villa', unit: '9', tenant: 'ALAM KHAN', rent: 1000 },
  { prop: 'Khalifa Villa', unit: '10', tenant: 'HABIB ULLAH', rent: 2000 },
  { prop: 'Khalifa Villa', unit: '11', tenant: 'NASIR/JUNAID', rent: 1200 },
  { prop: 'Khalifa Villa', unit: '12', tenant: 'NASER MAHMUD', rent: 1500 },
  { prop: 'Khalifa Villa', unit: '13', tenant: 'JUN MAYA', rent: 1200 },
  { prop: 'Khalifa Villa', unit: '14', tenant: 'MASUD', rent: 1500 },
  { prop: 'Khalifa Villa', unit: '15', tenant: 'MOHD PARVEZ', rent: 600 },
  { prop: 'Khalifa Villa', unit: '16', tenant: 'SORIF', rent: 500 },

  // Manaseer Villa
  { prop: 'Manaseer Villa', unit: '1', tenant: 'RAMESH', rent: 2200 },
  { prop: 'Manaseer Villa', unit: '2', tenant: 'NOEMIE', rent: 2500 },
  { prop: 'Manaseer Villa', unit: '3', tenant: 'MOSTAQ', rent: 2400 },
  { prop: 'Manaseer Villa', unit: '4', tenant: 'AHMED HAMED', rent: 2000 },
  { prop: 'Manaseer Villa', unit: '5', tenant: 'JAMAL', rent: 2000 },
  { prop: 'Manaseer Villa', unit: '6', tenant: 'MAHMUD', rent: 2400 },
  { prop: 'Manaseer Villa', unit: '7', tenant: 'INAM', rent: 1600 },
  { prop: 'Manaseer Villa', unit: '8', tenant: 'MOSTD', rent: 1300 },
  { prop: 'Manaseer Villa', unit: '9', tenant: 'SYED FORHAD', rent: 1400 },
  { prop: 'Manaseer Villa', unit: '10', tenant: 'ABU ALI', rent: 1700 },
  { prop: 'Manaseer Villa', unit: '11', tenant: 'LATHIFA', rent: 1200 },
  { prop: 'Manaseer Villa', unit: '12', tenant: 'ISLAM', rent: 1400 },
  { prop: 'Manaseer Villa', unit: '13', tenant: 'MAHESH', rent: 1400 },
  { prop: 'Manaseer Villa', unit: '14', tenant: 'MAHESH', rent: 1400 },
  { prop: 'Manaseer Villa', unit: '15', tenant: 'RAMJAN', rent: 1500 },

  // Al Maqam Villa
  { prop: 'Al Maqam Villa', unit: '1', tenant: 'DIVYA/ABYSN', rent: 3000 },
  { prop: 'Al Maqam Villa', unit: '2', tenant: 'LUWAI', rent: 1400 },
  { prop: 'Al Maqam Villa', unit: '3', tenant: 'MARWA', rent: 1800 },
  { prop: 'Al Maqam Villa', unit: '4', tenant: 'ABDEL', rent: 1600 },
  { prop: 'Al Maqam Villa', unit: '5', tenant: 'KHALED(01)', rent: 2200 },
  { prop: 'Al Maqam Villa', unit: '6', tenant: 'NARBIN', rent: 2000 },
  { prop: 'Al Maqam Villa', unit: '7', tenant: 'FATHI', rent: 1400 },
  { prop: 'Al Maqam Villa', unit: '8', tenant: 'ROSALYN', rent: 2400 },
  { prop: 'Al Maqam Villa', unit: '9', tenant: 'MNERBEN', rent: 1900 },

  // Matowa
  { prop: 'Matowa', unit: '1', tenant: 'AHMED THAJANI', rent: 2000 },
  { prop: 'Matowa', unit: '2', tenant: 'AHMED SADOON', rent: 2000 },
  { prop: 'Matowa', unit: '3', tenant: 'MEHMOOD', rent: 2300 },
  { prop: 'Matowa', unit: '4', tenant: 'MEHMOOD', rent: 2400 },
  { prop: 'Matowa', unit: '5', tenant: 'AHMED', rent: 2200 },
  { prop: 'Matowa', unit: '6', tenant: 'ABDULLAH', rent: 1800 },
  { prop: 'Matowa', unit: '7', tenant: 'AHMED', rent: 1800 },
  { prop: 'Matowa', unit: '8', tenant: 'PARES', rent: 1200 },
  { prop: 'Matowa', unit: '9', tenant: 'AKMAL', rent: 2000 },
  { prop: 'Matowa', unit: '10', tenant: 'HAFEEZI', rent: 1700 },
  { prop: 'Matowa', unit: '11', tenant: 'MD AFSAR', rent: 2900 },
  { prop: 'Matowa', unit: '12', tenant: 'MAHMUD FARHAN', rent: 2200 },

  // Al Mutarid Villa
  { prop: 'Al Mutarid Villa', unit: '1', tenant: null, rent: 1800 },  // vacant
  { prop: 'Al Mutarid Villa', unit: '2', tenant: 'DR. SAWAN', rent: 2700 },
  { prop: 'Al Mutarid Villa', unit: '3', tenant: 'ANNA/OLIVIA', rent: 1450 },
  { prop: 'Al Mutarid Villa', unit: '4', tenant: 'MELISHA', rent: 1800 },
  { prop: 'Al Mutarid Villa', unit: '5', tenant: 'AMIR', rent: 2000 },
  { prop: 'Al Mutarid Villa', unit: '6', tenant: 'MOHD.FAROUG', rent: 1650 },

  // Neima New
  { prop: 'Neima New', unit: '1', tenant: 'ABDULLAH', rent: 2200 },
  { prop: 'Neima New', unit: '2', tenant: 'BALOGUN', rent: 2000 },
  { prop: 'Neima New', unit: '3', tenant: 'BISHOY', rent: 1800 },
  { prop: 'Neima New', unit: '4', tenant: 'MUJAHID', rent: 1500 },
  { prop: 'Neima New', unit: '5', tenant: 'AZIZ', rent: 1800 },
  { prop: 'Neima New', unit: '6', tenant: 'OBALD', rent: 1000 },
  { prop: 'Neima New', unit: '7', tenant: 'TAMAM', rent: 1300 },
  { prop: 'Neima New', unit: '8', tenant: 'LUTFIA', rent: 1000 },
  { prop: 'Neima New', unit: '9', tenant: 'HAROON', rent: 1200 },
  { prop: 'Neima New', unit: '10', tenant: 'LAIYA', rent: 1200 },
  { prop: 'Neima New', unit: '11', tenant: 'IZNIK', rent: 1800 },
  { prop: 'Neima New', unit: '12', tenant: 'IBRAHIM', rent: 1200 },
  { prop: 'Neima New', unit: '13', tenant: 'OSAMA/ABDUL NAMED', rent: 1300 },
  { prop: 'Neima New', unit: '14', tenant: 'SALAIMAN', rent: 1600 },
  { prop: 'Neima New', unit: '15', tenant: 'RES', rent: 1000 },
  { prop: 'Neima New', unit: '16', tenant: 'RES', rent: 1000 },
  { prop: 'Neima New', unit: '17', tenant: 'RES', rent: 900 },
  { prop: 'Neima New', unit: '18', tenant: 'ASIM', rent: 1600 },
  { prop: 'Neima New', unit: '19', tenant: 'IBITER', rent: 1200 },
  { prop: 'Neima New', unit: '20', tenant: 'LAILA', rent: 1100 },
  { prop: 'Neima New', unit: '21', tenant: 'HIBA', rent: 1400 },
  { prop: 'Neima New', unit: '22', tenant: 'MOHAMMAD', rent: 1800 },
  { prop: 'Neima New', unit: '23', tenant: 'MOHAMAD REJAZ', rent: 1200 },
  { prop: 'Neima New', unit: '24', tenant: 'AKRAM', rent: 1800 },
  { prop: 'Neima New', unit: '25', tenant: 'AMAL', rent: 1500 },
  { prop: 'Neima New', unit: '26', tenant: 'MUSTAFA', rent: 1700 },
  { prop: 'Neima New', unit: '27', tenant: 'MOHAMMAD', rent: 1600 },
  { prop: 'Neima New', unit: '28', tenant: 'MOHAMMAD', rent: 1200 },
  { prop: 'Neima New', unit: '29', tenant: 'RIVERLY', rent: 1100 },
  { prop: 'Neima New', unit: '30', tenant: 'IRAK', rent: 1100 },
  { prop: 'Neima New', unit: '31', tenant: 'MOHAMMAD', rent: 1100 },
  { prop: 'Neima New', unit: '32', tenant: 'ERIC KYAMVADD', rent: 1200 },
  { prop: 'Neima New', unit: '33', tenant: 'NAYAWA', rent: 1100 },
  { prop: 'Neima New', unit: '34', tenant: 'ABDUR RAHMAN', rent: 1200 },
  { prop: 'Neima New', unit: '35', tenant: null, rent: 1200 },  // vacant
  { prop: 'Neima New', unit: '36', tenant: 'ALAUDDIN', rent: 1100 },
  { prop: 'Neima New', unit: '37', tenant: 'ALAUDDN', rent: 1200 },
  { prop: 'Neima New', unit: '38', tenant: 'HUFIR', rent: 1100 },
  { prop: 'Neima New', unit: '39', tenant: 'MOHD', rent: 1600 },
  { prop: 'Neima New', unit: '40', tenant: 'YAUOB', rent: 1600 },
  { prop: 'Neima New', unit: '41', tenant: 'MUHAD', rent: 1100 },
  { prop: 'Neima New', unit: '42', tenant: 'SHBEER', rent: 1300 },
  { prop: 'Neima New', unit: '43', tenant: 'ALA', rent: 1600 },

  // Neima Villa
  { prop: 'Neima Villa', unit: '1', tenant: 'ABDULLHA', rent: 2000 },
  { prop: 'Neima Villa', unit: '2', tenant: 'ANDELFATH', rent: 1800 },
  { prop: 'Neima Villa', unit: '3', tenant: 'YOUSEF', rent: 1500 },
  { prop: 'Neima Villa', unit: '4', tenant: 'HYTHEM', rent: 1350 },
  { prop: 'Neima Villa', unit: '5', tenant: 'HYTHEM', rent: 1300 },
  { prop: 'Neima Villa', unit: '6', tenant: 'MOHD JABER', rent: 1600 },
  { prop: 'Neima Villa', unit: '7', tenant: 'WAZIB', rent: 1700 },
  { prop: 'Neima Villa', unit: '8', tenant: 'KHADEEJAH', rent: 800 },
  { prop: 'Neima Villa', unit: '9', tenant: 'SOHEL', rent: 800 },
  { prop: 'Neima Villa', unit: '10', tenant: 'HANNY', rent: 1500 },
  { prop: 'Neima Villa', unit: '11', tenant: 'BILLAL', rent: 1400 },
  { prop: 'Neima Villa', unit: '12', tenant: 'SOLAIMAN', rent: 1600 },
  { prop: 'Neima Villa', unit: '13', tenant: 'ABDUL NAZAR', rent: 1500 },
  { prop: 'Neima Villa', unit: '14', tenant: 'OARA KHALIL', rent: 1500 },
  { prop: 'Neima Villa', unit: '15', tenant: 'DARA', rent: 1466 },
  { prop: 'Neima Villa', unit: '16', tenant: 'JISHAN', rent: 1500 },
  { prop: 'Neima Villa', unit: '17', tenant: 'ENTISAR', rent: 1500 },

  // New Office
  { prop: 'New Office', unit: '3AA', tenant: null, rent: null },  // vacant, no rent
  { prop: 'New Office', unit: '2', tenant: 'ROMIS', rent: 2500 },
  { prop: 'New Office', unit: '2A', tenant: 'UNAIS', rent: 4200 },
  { prop: 'New Office', unit: '2B', tenant: 'AHMED', rent: 2000 },
  { prop: 'New Office', unit: '3A', tenant: 'ABDUR RAHIM', rent: 2300 },
  { prop: 'New Office', unit: '3B', tenant: 'MARWAN', rent: 2000 },
  { prop: 'New Office', unit: '5', tenant: 'MR SAMIR', rent: 4500 },
  { prop: 'New Office', unit: '6A', tenant: 'MR SAMIR', rent: 2400 },
  { prop: 'New Office', unit: '6B', tenant: 'HAZAR', rent: 2000 },

  // Al Niyadat New
  { prop: 'Al Niyadat New', unit: '1', tenant: 'ASMA', rent: 1600 },
  { prop: 'Al Niyadat New', unit: '2', tenant: 'NIZAR HYTHAM', rent: 1700 },
  { prop: 'Al Niyadat New', unit: '3', tenant: 'MAMOON ZIAD HARB', rent: 1600 },
  { prop: 'Al Niyadat New', unit: '4', tenant: 'MAREAM ADEL', rent: 1500 },
  { prop: 'Al Niyadat New', unit: '5', tenant: 'SAFIA ZAHEER', rent: 1500 },
  { prop: 'Al Niyadat New', unit: '6', tenant: 'ALTAF', rent: 1500 },
  { prop: 'Al Niyadat New', unit: '7', tenant: 'AHMED', rent: 1500 },
  { prop: 'Al Niyadat New', unit: '8', tenant: 'SOOKANA', rent: 1500 },
  { prop: 'Al Niyadat New', unit: '9', tenant: 'MOROCO', rent: 1400 },
  { prop: 'Al Niyadat New', unit: '10', tenant: 'OUILAM TAHIRI', rent: 1350 },
  { prop: 'Al Niyadat New', unit: '11', tenant: 'FAYEZ BADER', rent: 2400 },
  { prop: 'Al Niyadat New', unit: '12', tenant: 'MOROCO', rent: 1500 },
  { prop: 'Al Niyadat New', unit: '13', tenant: 'INDIAN', rent: 2000 },
  { prop: 'Al Niyadat New', unit: '14', tenant: 'SAMIR', rent: 1350 },
  { prop: 'Al Niyadat New', unit: '15', tenant: 'MUZSTABA', rent: 1400 },
  { prop: 'Al Niyadat New', unit: '16', tenant: 'MORCO', rent: 1400 },
  { prop: 'Al Niyadat New', unit: '17', tenant: 'YOUNUS', rent: 1500 },
  { prop: 'Al Niyadat New', unit: '18', tenant: 'ABDUKKAH', rent: 1600 },
  { prop: 'Al Niyadat New', unit: '19', tenant: 'JAHANGIR', rent: 1700 },
  { prop: 'Al Niyadat New', unit: '20', tenant: 'AHMED', rent: 1500 },
  { prop: 'Al Niyadat New', unit: '21', tenant: 'ABDULLHA', rent: 1600 },
  { prop: 'Al Niyadat New', unit: '22', tenant: 'SUDANI', rent: 1400 },
  { prop: 'Al Niyadat New', unit: '23', tenant: 'RIJAZ', rent: 1500 },
  { prop: 'Al Niyadat New', unit: '24', tenant: 'IBRAHIM', rent: 2200 },
  { prop: 'Al Niyadat New', unit: '25', tenant: 'RASHA', rent: 1400 },
  { prop: 'Al Niyadat New', unit: '26', tenant: 'NADA AHMED', rent: 1450 },
  { prop: 'Al Niyadat New', unit: '27', tenant: 'AYA', rent: 2500 },
  { prop: 'Al Niyadat New', unit: '28', tenant: 'KHALED', rent: 1400 },
  { prop: 'Al Niyadat New', unit: '29', tenant: 'ABDUR RAHMAN', rent: 1900 },
  { prop: 'Al Niyadat New', unit: '30', tenant: 'ABDU MAMA/BADER', rent: 3400 },
  { prop: 'Al Niyadat New', unit: '31', tenant: 'MAMA ALI/NOURA ALI', rent: 1400 },
  { prop: 'Al Niyadat New', unit: '32', tenant: 'MONAAM BIN JAMAA', rent: 2600 },

  // Al Niyadat Old
  { prop: 'Al Niyadat Old', unit: '1', tenant: 'KHALID', rent: 1200 },
  { prop: 'Al Niyadat Old', unit: '2', tenant: 'VAIT NAM', rent: 3500 },
  { prop: 'Al Niyadat Old', unit: '3', tenant: 'SADI', rent: 1450 },
  { prop: 'Al Niyadat Old', unit: '4', tenant: 'AHMED', rent: 2600 },
  { prop: 'Al Niyadat Old', unit: '5', tenant: 'ISLAM', rent: 3500 },
  { prop: 'Al Niyadat Old', unit: '6', tenant: 'PILIPO', rent: 3500 },
  { prop: 'Al Niyadat Old', unit: '7', tenant: 'FERIYAL', rent: 3400 },
  { prop: 'Al Niyadat Old', unit: '8', tenant: 'ROOH MOHD', rent: 3400 },
  { prop: 'Al Niyadat Old', unit: '9', tenant: 'AHSAN', rent: 2400 },
  { prop: 'Al Niyadat Old', unit: '10', tenant: 'AMJAD', rent: 1300 },
  { prop: 'Al Niyadat Old', unit: '11', tenant: 'IMAN', rent: 2500 },

  // Salhie Villa
  { prop: 'Salhie Villa', unit: '1', tenant: 'HAFEEZI', rent: 2500 },
  { prop: 'Salhie Villa', unit: '2', tenant: 'SALWA KAMIL', rent: 1700 },
  { prop: 'Salhie Villa', unit: '3', tenant: 'SCHOOL', rent: 2083 },
  { prop: 'Salhie Villa', unit: '4', tenant: 'ACIA', rent: 1700 },
  { prop: 'Salhie Villa', unit: '5', tenant: 'SAYEEDA', rent: 1000 },
  { prop: 'Salhie Villa', unit: '6', tenant: 'FARHAN', rent: 1900 },
  { prop: 'Salhie Villa', unit: '7', tenant: 'ESSAM ABDULLAH', rent: 1700 },
  { prop: 'Salhie Villa', unit: '8', tenant: 'FALCON SCHOOL', rent: 3333 },
  { prop: 'Salhie Villa', unit: '9', tenant: 'MOHED', rent: 1200 },
  { prop: 'Salhie Villa', unit: '10', tenant: 'HIND', rent: 800 },
  { prop: 'Salhie Villa', unit: '11', tenant: 'TANHA', rent: 2000 },

  // Al Sinayaa Building
  { prop: 'Al Sinayaa Building', unit: 'GARAGE', tenant: 'LIMITED SPEED CAR', rent: 6250 },
  { prop: 'Al Sinayaa Building', unit: 'SHOP1', tenant: 'ARSHAD BLDG MAT', rent: null },  // no rent listed
  { prop: 'Al Sinayaa Building', unit: 'SHOP2', tenant: 'M.FAZLUL KARIM', rent: 2000 },
  { prop: 'Al Sinayaa Building', unit: 'SHOP3', tenant: 'SALOON', rent: null },  // no rent listed
  { prop: 'Al Sinayaa Building', unit: 'SHOP4', tenant: 'AKHTER', rent: null },  // no rent listed
  { prop: 'Al Sinayaa Building', unit: 'SHOP5', tenant: 'A/C CHANDAN', rent: null },  // no rent listed
  { prop: 'Al Sinayaa Building', unit: 'OFFICE1', tenant: 'TANVIR', rent: 1200 },
  { prop: 'Al Sinayaa Building', unit: 'OFFICE2', tenant: 'SHAHED CHHAN', rent: 1400 },
  { prop: 'Al Sinayaa Building', unit: 'OFFICE3', tenant: 'MOSHARAF', rent: 1300 },
  { prop: 'Al Sinayaa Building', unit: 'OFFICE4', tenant: 'KAMRAN', rent: 1000 },
  { prop: 'Al Sinayaa Building', unit: 'OFFICE5', tenant: 'ZAIN ALI', rent: 1200 },
  { prop: 'Al Sinayaa Building', unit: 'OFFICE6', tenant: 'KASER', rent: 1300 },
  { prop: 'Al Sinayaa Building', unit: 'OFFICE7', tenant: 'ABDUL', rent: 1200 },
  { prop: 'Al Sinayaa Building', unit: 'OFFICE8', tenant: 'QAISER MONIR', rent: 1300 },
  { prop: 'Al Sinayaa Building', unit: 'OFFICE9', tenant: 'ZAHID', rent: 1200 },
  { prop: 'Al Sinayaa Building', unit: 'OFFICE10', tenant: null, rent: 1100 },  // vacant
  { prop: 'Al Sinayaa Building', unit: 'OFFICE11', tenant: 'IMRAN CARP.', rent: 300 },

  // Al Sarooj Villa
  { prop: 'Al Sarooj Villa', unit: '1', tenant: 'ANAS', rent: 3200 },
  { prop: 'Al Sarooj Villa', unit: '2', tenant: 'MUHAMMAD AAMR', rent: 3000 },
  { prop: 'Al Sarooj Villa', unit: '3', tenant: 'ALI AHMED', rent: 3200 },
  { prop: 'Al Sarooj Villa', unit: '4', tenant: 'RANIA KADAH', rent: 3000 },
  { prop: 'Al Sarooj Villa', unit: '5', tenant: 'BAHA ELDEEN', rent: 2600 },
  { prop: 'Al Sarooj Villa', unit: '6', tenant: 'THAMER KAMEL', rent: 3000 },
  { prop: 'Al Sarooj Villa', unit: '7', tenant: 'MUSTAFA', rent: 3400 },
  { prop: 'Al Sarooj Villa', unit: '8', tenant: 'HUSAM', rent: 3200 },

  // Sumali Villa
  { prop: 'Sumali Villa', unit: '1', tenant: 'ARMAN', rent: 1800 },
  { prop: 'Sumali Villa', unit: '2', tenant: 'SALIM AL NAS', rent: 2500 },
  { prop: 'Sumali Villa', unit: '3', tenant: 'SADDAM', rent: 1700 },
  { prop: 'Sumali Villa', unit: '4', tenant: 'BINDU', rent: 1850 },
  { prop: 'Sumali Villa', unit: '5', tenant: 'EMMANUEL', rent: 2300 },

  // Zafrana Villa
  { prop: 'Zafrana Villa', unit: '1', tenant: 'HAMZA', rent: 2000 },
  { prop: 'Zafrana Villa', unit: '2', tenant: 'SAND', rent: 2200 },
  { prop: 'Zafrana Villa', unit: '3', tenant: 'MOHD. SAYED', rent: 3000 },
  { prop: 'Zafrana Villa', unit: '4', tenant: 'SHAADI', rent: 3000 },
  { prop: 'Zafrana Villa', unit: '5', tenant: 'ALAUDDIN', rent: 3000 },
  { prop: 'Zafrana Villa', unit: '6', tenant: 'VARGHESE', rent: 2800 },
  { prop: 'Zafrana Villa', unit: '7', tenant: 'HASHEM JAMIL', rent: 1700 },
  { prop: 'Zafrana Villa', unit: '8', tenant: 'SUMAIYA ABDU', rent: 2300 },
  { prop: 'Zafrana Villa', unit: '9', tenant: 'READ', rent: 2000 },
  { prop: 'Zafrana Villa', unit: '10', tenant: 'KAWSER', rent: 2000 },
  { prop: 'Zafrana Villa', unit: '11', tenant: 'HAEEB', rent: 1700 },
  { prop: 'Zafrana Villa', unit: '12', tenant: 'MRS NAJWA', rent: 1700 },

  // Zakher Building
  { prop: 'Zakher Building', unit: 'F1', tenant: 'INDIAN', rent: 1400 },
  { prop: 'Zakher Building', unit: 'F2', tenant: 'AMINA', rent: 1250 },
  { prop: 'Zakher Building', unit: 'F3', tenant: 'AHMED', rent: 1500 },
  { prop: 'Zakher Building', unit: 'F4', tenant: 'AMAR', rent: 1800 },
  { prop: 'Zakher Building', unit: 'F5', tenant: null, rent: 1250 },  // vacant
  { prop: 'Zakher Building', unit: 'F6', tenant: 'ADEL', rent: 1400 },
  { prop: 'Zakher Building', unit: 'F7', tenant: 'EYNAS', rent: 1800 },
  { prop: 'Zakher Building', unit: 'F8', tenant: 'EGPT', rent: 1800 },
  { prop: 'Zakher Building', unit: 'G1', tenant: 'HASNAN', rent: 1650 },
  { prop: 'Zakher Building', unit: 'G2', tenant: 'RAMI', rent: 2600 },
  { prop: 'Zakher Building', unit: 'G3', tenant: 'SAMHA', rent: 1550 },
  { prop: 'Zakher Building', unit: 'G4', tenant: 'MIRACLE', rent: 2000 },
  { prop: 'Zakher Building', unit: 'G5', tenant: 'EMAWAB', rent: 2000 },
  { prop: 'Zakher Building', unit: 'G6', tenant: 'SUDANI', rent: 1900 },
  { prop: 'Zakher Building', unit: 'G7', tenant: 'SAMAN', rent: 1600 },
  { prop: 'Zakher Building', unit: 'G8', tenant: null, rent: 800 },  // vacant
];

async function main() {
  console.log('=== REAL DATA IMPORT ===\n');
  
  // Step 1: Aggregate data by property
  const propertyMap = new Map();
  for (const row of EXCEL_DATA) {
    if (!propertyMap.has(row.prop)) {
      propertyMap.set(row.prop, { units: [], totalRent: 0, tenantedCount: 0 });
    }
    const prop = propertyMap.get(row.prop);
    prop.units.push(row);
    if (row.tenant) prop.tenantedCount++;
    if (row.rent) prop.totalRent += row.rent;
  }
  
  console.log(`Found ${propertyMap.size} properties, ${EXCEL_DATA.length} total units`);
  console.log(`Tenanted: ${EXCEL_DATA.filter(r => r.tenant).length}, Vacant: ${EXCEL_DATA.filter(r => !r.tenant).length}`);
  console.log(`Total monthly rent: ${[...propertyMap.values()].reduce((s, p) => s + p.totalRent, 0)} AED\n`);
  
  // Step 2: Clear any existing data (replace mode)
  console.log('1. Clearing existing data...');
  const existingTenants = await prisma.tenant.findMany({
    where: { companyId: COMPANY_ID, deletedAt: null },
    select: { id: true }
  });
  
  if (existingTenants.length > 0) {
    const tenantIds = existingTenants.map(t => t.id);
    await prisma.$transaction(async (tx) => {
      await tx.receipt.deleteMany({ where: { tenantId: { in: tenantIds } } });
      await tx.payment.deleteMany({ where: { tenantId: { in: tenantIds } } });
    });
    console.log(`   Deleted ${tenantIds.length} tenant-related records`);
  }
  
  await prisma.maintenance.updateMany({
    where: { companyId: COMPANY_ID, deletedAt: null },
    data: { deletedAt: new Date() }
  });
  await prisma.expense.updateMany({
    where: { companyId: COMPANY_ID, deletedAt: null },
    data: { deletedAt: new Date() }
  });
  await prisma.tenant.updateMany({
    where: { companyId: COMPANY_ID, deletedAt: null },
    data: { deletedAt: new Date() }
  });
  await prisma.property.updateMany({
    where: { companyId: COMPANY_ID, deletedAt: null },
    data: { deletedAt: new Date() }
  });
  console.log('   Cleared all existing data\n');
  
  // Step 3: Create properties
  console.log('2. Creating properties...');
  const propertyIdMap = new Map();
  
  for (const [propName, propData] of propertyMap) {
    const propType = PROPERTY_TYPE_MAP[propName] || 'apartment';
    const totalUnits = propData.units.length;
    
    const property = await prisma.property.create({
      data: {
        companyId: COMPANY_ID,
        name: propName,
        type: propType,
        totalUnits: totalUnits,
        floors: propType === 'villa' ? 2 : (propType === 'apartment' || propType === 'mixed_use' ? Math.ceil(totalUnits / 8) : 3),
      }
    });
    
    propertyIdMap.set(propName, property.id);
    console.log(`   ${propName} (${propType}, ${totalUnits} units) → ${property.id}`);
  }
  console.log(`   Created ${propertyIdMap.size} properties\n`);
  
  // Step 4: Create tenants (only for occupied units)
  console.log('3. Creating tenants...');
  let tenantCount = 0;
  let skippedCount = 0;
  let noRentCount = 0;
  const tenantsWithNoRent = [];
  
  // Process in batches of 50 to avoid transaction timeouts
  const occupiedUnits = EXCEL_DATA.filter(r => r.tenant);
  const BATCH_SIZE = 50;
  
  for (let i = 0; i < occupiedUnits.length; i += BATCH_SIZE) {
    const batch = occupiedUnits.slice(i, i + BATCH_SIZE);
    
    await prisma.$transaction(async (tx) => {
      for (const row of batch) {
        const propertyId = propertyIdMap.get(row.prop);
        if (!propertyId) {
          console.error(`   ERROR: No property ID for "${row.prop}"`);
          skippedCount++;
          continue;
        }
        
        const propType = PROPERTY_TYPE_MAP[row.prop] || 'apartment';
        const unitType = inferUnitType(row.prop, row.unit, propType);
        
        // Handle tenants without rent
        let rentAmount = row.rent || 0;
        let notes = null;
        if (!row.rent) {
          rentAmount = 0;
          notes = 'RENT AMOUNT PENDING - needs to be updated';
          noRentCount++;
          tenantsWithNoRent.push(`${row.prop} - Unit ${row.unit} - ${row.tenant}`);
        }
        
        try {
          await tx.tenant.create({
            data: {
              companyId: COMPANY_ID,
              propertyId: propertyId,
              name: row.tenant,
              phone: PLACEHOLDER_PHONE,
              unitNumber: String(row.unit),
              unitType: unitType,
              rentAmount: rentAmount,
              municipalityFee: rentAmount > 0 ? Math.round(rentAmount * 0.05 * 100) / 100 : 0,
              securityDeposit: rentAmount > 0 ? rentAmount : null,
              status: 'active',
              notes: notes,
            }
          });
          tenantCount++;
        } catch (err) {
          console.error(`   ERROR creating tenant ${row.tenant} in ${row.prop}: ${err.message}`);
          skippedCount++;
        }
      }
    });
    
    console.log(`   Batch ${Math.floor(i / BATCH_SIZE) + 1}: processed ${Math.min(i + BATCH_SIZE, occupiedUnits.length)} / ${occupiedUnits.length}`);
  }
  
  console.log(`   Created ${tenantCount} tenants, skipped ${skippedCount}`);
  if (noRentCount > 0) {
    console.log(`   WARNING: ${noRentCount} tenants have no rent amount (set to 0):`);
    tenantsWithNoRent.forEach(t => console.log(`     - ${t}`));
  }
  console.log();
  
  // Step 5: Update company maxProperties to accommodate all properties
  console.log('4. Updating company limits...');
  await prisma.company.update({
    where: { id: COMPANY_ID },
    data: {
      maxProperties: 50,
      maxUsers: 10,
    }
  });
  console.log('   Updated company maxProperties=50, maxUsers=10\n');
  
  // Step 6: Verification
  console.log('5. Verification...');
  const properties = await prisma.property.findMany({
    where: { companyId: COMPANY_ID, deletedAt: null },
    select: {
      name: true,
      type: true,
      totalUnits: true,
      _count: { select: { tenants: { where: { deletedAt: null } } } }
    },
    orderBy: { name: 'asc' }
  });
  
  console.log('\n   Property Summary:');
  console.log('   ─────────────────────────────────────────────────────────────');
  let totalUnits = 0;
  let totalTenants = 0;
  let totalMonthlyRent = 0;
  
  for (const prop of properties) {
    const propData = propertyMap.get(prop.name);
    const monthlyRent = propData ? propData.totalRent : 0;
    totalUnits += prop.totalUnits;
    totalTenants += prop._count.tenants;
    totalMonthlyRent += monthlyRent;
    console.log(`   ${prop.name.padEnd(25)} | Type: ${prop.type.padEnd(10)} | Units: ${String(prop.totalUnits).padStart(3)} | Tenants: ${String(prop._count.tenants).padStart(3)} | Rent: ${String(monthlyRent).padStart(7)} AED`);
  }
  
  console.log('   ─────────────────────────────────────────────────────────────');
  console.log(`   TOTAL: ${properties.length} properties | ${totalUnits} units | ${totalTenants} tenants | ${totalMonthlyRent} AED/month`);
  console.log(`   Annual projection: ${totalMonthlyRent * 12} AED/year`);
  
  // Verify vacancy count
  const vacantUnits = EXCEL_DATA.filter(r => !r.tenant).length;
  console.log(`   Vacant units: ${vacantUnits}`);
  console.log(`   Occupancy rate: ${((totalTenants / totalUnits) * 100).toFixed(1)}%`);
  
  await prisma.$disconnect();
  console.log('\n=== IMPORT COMPLETE ===');
}

main().catch(e => { console.error('IMPORT FAILED:', e.message); process.exit(1); });
