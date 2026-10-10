import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

function loadEnv() {
  const envPath = resolve(process.cwd(), ".env.local");
  if (!existsSync(envPath)) return;

  const content = readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[key]) {
      process.env[key] = val;
    }
  }
}

loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secretKey = process.env.SUPABASE_SECRET_KEY;

if (!url || !secretKey) {
  console.error("Faltan las variables NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SECRET_KEY.");
  process.exit(1);
}

const supabase = createClient(url, secretKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const spacesData = [
  {
    id: "11111111-1111-1111-1111-111111111111",
    name: "Local 1",
    description: "Local comercial en planta baja con frente a la calle, ideal para tienda o consultorio.",
    price: 8000,
    status: "occupied",
    sort_order: 1,
  },
  {
    id: "22222222-2222-2222-2222-222222222222",
    name: "Local 2",
    description: "Local comercial en planta baja con amplia vitrina y excelente visibilidad.",
    price: 8000,
    status: "occupied",
    sort_order: 2,
  },
  {
    id: "33333333-3333-3333-3333-333333333333",
    name: "Local 3",
    description: "Local comercial nuevo, actualmente en construcción. Reserva el tuyo.",
    price: 8500,
    status: "construction",
    sort_order: 3,
  },
  {
    id: "44444444-4444-4444-4444-444444444444",
    name: "Local 4",
    description: "Local comercial nuevo, actualmente en construcción. Reserva el tuyo.",
    price: 8500,
    status: "construction",
    sort_order: 4,
  },
  {
    id: "55555555-5555-5555-5555-555555555555",
    name: "Local 5",
    description: "Local comercial nuevo, actualmente en construcción. Reserva el tuyo.",
    price: 9000,
    status: "construction",
    sort_order: 5,
  },
];

const usersToCreate = [
  {
    email: "admin@plaza-aragon.com",
    password: "Password123!",
    name: "Administrador Plaza Aragón",
    role: "admin",
  },
  {
    email: "inquilino1@plaza-aragon.com",
    password: "Password123!",
    name: "Farmacia San José",
    contact_info: "+504 9988-7766",
    role: "tenant",
    space_id: "11111111-1111-1111-1111-111111111111",
    monthly_rent: 8000,
  },
  {
    email: "inquilino2@plaza-aragon.com",
    password: "Password123!",
    name: "Café Olanchito",
    contact_info: "+504 9955-4433",
    role: "tenant",
    space_id: "22222222-2222-2222-2222-222222222222",
    monthly_rent: 8000,
  },
];

async function run() {
  for (const space of spacesData) {
    const { error } = await supabase.from("spaces").upsert(space, { onConflict: "id" });
    if (error) {
      console.error(`Error guardando local ${space.name}:`, error.message);
    }
  }

  const { data: existingUsersData } = await supabase.auth.admin.listUsers();
  const existingUsers = existingUsersData?.users ?? [];

  for (const item of usersToCreate) {
    let userId;
    const found = existingUsers.find((u) => u.email === item.email);

    if (found) {
      userId = found.id;
      const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
        password: item.password,
        app_metadata: { role: item.role },
        user_metadata: { name: item.name },
        email_confirm: true,
      });
      if (updateError) {
        console.error(`Error actualizando usuario ${item.email}:`, updateError.message);
      }
    } else {
      const { data: created, error: createError } = await supabase.auth.admin.createUser({
        email: item.email,
        password: item.password,
        app_metadata: { role: item.role },
        user_metadata: { name: item.name },
        email_confirm: true,
      });

      if (createError || !created?.user) {
        console.error(`Error creando usuario ${item.email}:`, createError?.message);
        continue;
      }
      userId = created.user.id;
    }

    if (item.role === "tenant" && item.space_id) {
      const { error: tenantError } = await supabase.from("tenants").upsert({
        id: userId,
        name: item.name,
        contact_info: item.contact_info ?? "",
      }, { onConflict: "id" });

      if (tenantError) {
        console.error(`Error guardando perfil inquilino ${item.name}:`, tenantError.message);
      }

      const { data: existingLease } = await supabase
        .from("leases")
        .select("id")
        .eq("space_id", item.space_id)
        .eq("active", true)
        .maybeSingle();

      if (!existingLease) {
        const { error: leaseError } = await supabase.from("leases").insert({
          space_id: item.space_id,
          tenant_id: userId,
          start_date: "2026-01-01",
          end_date: "2026-12-31",
          monthly_rent: item.monthly_rent,
          active: true,
        });

        if (leaseError) {
          console.error(`Error asignando contrato a ${item.name}:`, leaseError.message);
        }
      }
    }
  }

  console.log("Usuarios y locales inicializados exitosamente.");
}

run();
