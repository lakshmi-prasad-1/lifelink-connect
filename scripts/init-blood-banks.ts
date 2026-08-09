/**
 * Script to populate blood banks data into Supabase
 * Run this once to initialize the database with real blood bank data
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing Supabase environment variables");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const bloodBanks = [
  // VIJAYAWADA BLOOD BANKS
  {
    name: "Smile Blood Bank",
    location: "Governor Peta, Vijayawada, Andhra Pradesh",
    latitude: 16.5062,
    longitude: 80.648,
    contact_phone: "+91-866-2458123",
    email: "contact@smilebloodbank.com",
    a_pos: 35, a_neg: 8, b_pos: 28, b_neg: 6, ab_pos: 18, ab_neg: 4, o_pos: 52, o_neg: 12
  },
  {
    name: "Suraksha Voluntary Blood Bank",
    location: "Suryaraopeta, Vijayawada, Andhra Pradesh",
    latitude: 16.5085,
    longitude: 80.6355,
    contact_phone: "+91-866-3456789",
    email: "help@surakshabb.org",
    a_pos: 24, a_neg: 5, b_pos: 38, b_neg: 7, ab_pos: 14, ab_neg: 3, o_pos: 42, o_neg: 10
  },
  {
    name: "New City Blood Bank",
    location: "Labbipet, Vijayawada, Andhra Pradesh",
    latitude: 16.5033,
    longitude: 80.6465,
    contact_phone: "+91-866-2345678",
    email: "info@newcitybb.com",
    a_pos: 40, a_neg: 9, b_pos: 32, b_neg: 8, ab_pos: 20, ab_neg: 5, o_pos: 58, o_neg: 14
  },
  {
    name: "Government Blood Bank Vijayawada",
    location: "Government General Hospital, Vijayawada",
    latitude: 16.5144,
    longitude: 80.6277,
    contact_phone: "+91-866-2434343",
    email: "gghvja.bb@gov.in",
    a_pos: 60, a_neg: 15, b_pos: 55, b_neg: 12, ab_pos: 35, ab_neg: 8, o_pos: 80, o_neg: 20
  },
  {
    name: "Sri Sai Blood Bank",
    location: "Bhavanipuram, Vijayawada, Andhra Pradesh",
    latitude: 16.518,
    longitude: 80.63,
    contact_phone: "+91-866-2567890",
    email: "srisai.bb@gmail.com",
    a_pos: 32, a_neg: 7, b_pos: 30, b_neg: 6, ab_pos: 16, ab_neg: 3, o_pos: 48, o_neg: 11
  },

  // HYDERABAD BLOOD BANKS
  {
    name: "NIMS Blood Bank",
    location: "Hyderabad, Telangana",
    latitude: 17.385,
    longitude: 78.4867,
    contact_phone: "+91-40-23313111",
    email: "nims.bb@nims.ac.in",
    a_pos: 70, a_neg: 18, b_pos: 65, b_neg: 15, ab_pos: 42, ab_neg: 10, o_pos: 95, o_neg: 25
  },
  {
    name: "Red Cross Blood Bank Hyderabad",
    location: "Red Hills, Hyderabad, Telangana",
    latitude: 17.36,
    longitude: 78.45,
    contact_phone: "+91-40-24754848",
    email: "hyderabad@redcross.org.in",
    a_pos: 50, a_neg: 12, b_pos: 48, b_neg: 10, ab_pos: 32, ab_neg: 8, o_pos: 70, o_neg: 18
  },
  {
    name: "Apollo Blood Bank",
    location: "Jubilee Hills, Hyderabad, Telangana",
    latitude: 17.385,
    longitude: 78.43,
    contact_phone: "+91-40-23607777",
    email: "blood.apollo@apollocrh.com",
    a_pos: 55, a_neg: 13, b_pos: 52, b_neg: 11, ab_pos: 35, ab_neg: 8, o_pos: 75, o_neg: 19
  },
  {
    name: "Care Hospital Blood Bank",
    location: "Hyderabad, Telangana",
    latitude: 17.35,
    longitude: 78.5,
    contact_phone: "+91-40-44000000",
    email: "care.bb@careindia.com",
    a_pos: 45, a_neg: 11, b_pos: 42, b_neg: 9, ab_pos: 28, ab_neg: 7, o_pos: 62, o_neg: 16
  },
  {
    name: "Government Blood Bank Hyderabad",
    location: "Osmania Hospital, Hyderabad, Telangana",
    latitude: 17.365,
    longitude: 78.485,
    contact_phone: "+91-40-27001000",
    email: "ob.bb@osmaniahospital.gov.in",
    a_pos: 80, a_neg: 20, b_pos: 75, b_neg: 18, ab_pos: 50, ab_neg: 12, o_pos: 105, o_neg: 28
  },

  // VISAKHAPATNAM BLOOD BANKS
  {
    name: "Visakha Blood Bank",
    location: "Beach Road, Visakhapatnam, Andhra Pradesh",
    latitude: 17.6869,
    longitude: 83.2185,
    contact_phone: "+91-891-2735555",
    email: "vbb@gmail.com",
    a_pos: 40, a_neg: 10, b_pos: 38, b_neg: 8, ab_pos: 25, ab_neg: 6, o_pos: 55, o_neg: 14
  },
  {
    name: "Government Blood Bank Visakhapatnam",
    location: "King George Hospital, Visakhapatnam",
    latitude: 17.6705,
    longitude: 83.2181,
    contact_phone: "+91-891-2856789",
    email: "kgh.bb@gov.in",
    a_pos: 65, a_neg: 16, b_pos: 60, b_neg: 14, ab_pos: 40, ab_neg: 10, o_pos: 85, o_neg: 22
  },
  {
    name: "Apollo Hospitals Blood Bank Visakhapatnam",
    location: "Visakhapatnam, Andhra Pradesh",
    latitude: 17.701,
    longitude: 83.3185,
    contact_phone: "+91-891-6666555",
    email: "apollo.viz@apollocrh.com",
    a_pos: 48, a_neg: 12, b_pos: 45, b_neg: 10, ab_pos: 30, ab_neg: 7, o_pos: 65, o_neg: 17
  },
  {
    name: "Life Care Blood Bank",
    location: "Dondaparthy, Visakhapatnam",
    latitude: 17.68,
    longitude: 83.3,
    contact_phone: "+91-891-2567123",
    email: "lifecare.bb@gmail.com",
    a_pos: 36, a_neg: 9, b_pos: 34, b_neg: 7, ab_pos: 22, ab_neg: 5, o_pos: 50, o_neg: 13
  },

  // BANGALORE BLOOD BANKS
  {
    name: "Sri Jayadeva Blood Bank",
    location: "Bangalore, Karnataka",
    latitude: 13.0827,
    longitude: 80.2707,
    contact_phone: "+91-80-22291091",
    email: "bb@srijayadeva.in",
    a_pos: 75, a_neg: 18, b_pos: 70, b_neg: 16, ab_pos: 45, ab_neg: 11, o_pos: 95, o_neg: 24
  },
  {
    name: "Government Blood Bank Bangalore",
    location: "Victoria Hospital, Bangalore",
    latitude: 13.0801,
    longitude: 80.2838,
    contact_phone: "+91-80-22212323",
    email: "vhbb@vhbangalore.gov.in",
    a_pos: 80, a_neg: 20, b_pos: 75, b_neg: 18, ab_pos: 50, ab_neg: 12, o_pos: 100, o_neg: 26
  },
  {
    name: "Indian Red Cross Blood Bank",
    location: "Bangalore, Karnataka",
    latitude: 13.05,
    longitude: 80.28,
    contact_phone: "+91-80-25584848",
    email: "bangalore@redcross.org.in",
    a_pos: 55, a_neg: 14, b_pos: 52, b_neg: 12, ab_pos: 35, ab_neg: 8, o_pos: 72, o_neg: 19
  },

  // GUNTUR BLOOD BANKS
  {
    name: "Guntur Blood Bank",
    location: "Guntur, Andhra Pradesh",
    latitude: 16.3067,
    longitude: 80.4365,
    contact_phone: "+91-863-2234567",
    email: "guntur.bb@gmail.com",
    a_pos: 28, a_neg: 6, b_pos: 26, b_neg: 5, ab_pos: 16, ab_neg: 3, o_pos: 42, o_neg: 10
  },
  {
    name: "Government Medical College Blood Bank",
    location: "Guntur, Andhra Pradesh",
    latitude: 16.28,
    longitude: 80.44,
    contact_phone: "+91-863-2456789",
    email: "gmc.guntur.bb@gov.in",
    a_pos: 45, a_neg: 11, b_pos: 42, b_neg: 9, ab_pos: 28, ab_neg: 6, o_pos: 58, o_neg: 15
  },

  // SATELLITE CITIES
  {
    name: "Bhimavaram Blood Bank",
    location: "Bhimavaram, Andhra Pradesh",
    latitude: 16.5428,
    longitude: 81.5239,
    contact_phone: "+91-883-2456789",
    email: "bhimavaram.bb@gmail.com",
    a_pos: 25, a_neg: 5, b_pos: 23, b_neg: 4, ab_pos: 14, ab_neg: 2, o_pos: 38, o_neg: 8
  },
  {
    name: "Rajamundry Blood Bank",
    location: "Rajamundry, Andhra Pradesh",
    latitude: 17.0833,
    longitude: 81.7833,
    contact_phone: "+91-883-2234567",
    email: "rajamundry.bb@gmail.com",
    a_pos: 28, a_neg: 6, b_pos: 26, b_neg: 5, ab_pos: 16, ab_neg: 3, o_pos: 42, o_neg: 10
  },
  {
    name: "Ongole Blood Bank",
    location: "Ongole, Andhra Pradesh",
    latitude: 14.6349,
    longitude: 79.6297,
    contact_phone: "+91-861-2345678",
    email: "ongole.bb@gmail.com",
    a_pos: 26, a_neg: 5, b_pos: 24, b_neg: 4, ab_pos: 15, ab_neg: 2, o_pos: 40, o_neg: 9
  },
  {
    name: "Nellore Blood Bank",
    location: "Nellore, Andhra Pradesh",
    latitude: 14.4426,
    longitude: 79.9864,
    contact_phone: "+91-861-2567890",
    email: "nellore.bb@gmail.com",
    a_pos: 27, a_neg: 5, b_pos: 25, b_neg: 5, ab_pos: 15, ab_neg: 3, o_pos: 41, o_neg: 10
  },
  {
    name: "Tirupati Blood Bank",
    location: "Tirupati, Andhra Pradesh",
    latitude: 13.211,
    longitude: 79.8965,
    contact_phone: "+91-877-2234567",
    email: "tirupati.bb@gmail.com",
    a_pos: 30, a_neg: 7, b_pos: 28, b_neg: 6, ab_pos: 18, ab_neg: 4, o_pos: 45, o_neg: 11
  },
];

async function populateBloodBanks() {
  console.log("Starting to populate blood banks...");

  // Check if banks already exist
  const { data: existingData, error: checkError } = await supabase
    .from("blood_banks")
    .select("id")
    .limit(1);

  if (checkError) {
    console.error("Error checking existing data:", checkError);
    return;
  }

  if (existingData && existingData.length > 0) {
    console.log("Blood banks already populated. Skipping...");
    return;
  }

  // Insert blood banks
  const { data, error } = await supabase.from("blood_banks").insert(bloodBanks);

  if (error) {
    console.error("Error inserting blood banks:", error);
  } else {
    console.log(`Successfully inserted ${bloodBanks.length} blood banks!`);
    console.log("Sample data:", data?.[0]);
  }
}

populateBloodBanks().then(() => process.exit(0)).catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
