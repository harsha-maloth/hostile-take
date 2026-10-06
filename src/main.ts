import "./styles.css";
import { pingSupabase } from "./supabase";

const app = document.querySelector<HTMLDivElement>("#app")!;
app.innerHTML = `
  <h1>Hostile <span>Take</span></h1>
  <p class="tag">Buy low. Take over. Win big.</p>
  <section class="card">
    <h2>Start a new game</h2>
    <p class="status" id="status">Checking connection…</p>
    <div class="row"><button id="new">New game</button><button class="ghost" id="resume">Resume</button></div>
  </section>
  <section class="card">
    <h2>Market preview</h2>
    <p class="num">Ironclad Steel <span class="gain">+2.4%</span></p>
    <p class="num">Megahertz Telecom <span class="loss">-1.1%</span></p>
  </section>`;

pingSupabase().then((s) => (document.querySelector("#status")!.textContent = s));
