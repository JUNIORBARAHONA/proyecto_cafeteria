// --- Autenticación y sesión ---
const CLAVE_DEFAULT = "cafecol2024";
const CLAVE_KEY = "adminClave";
const LOGIN_KEY = "adminLogeado";
const SESSION_TIME = 10 * 60 * 1000; // 10 minutos
let sessionTimeout;

function getClave() {
  return localStorage.getItem(CLAVE_KEY) || CLAVE_DEFAULT;
}

function resetSessionTimer() {
  clearTimeout(sessionTimeout);
  sessionTimeout = setTimeout(logout, SESSION_TIME);
}

function logout() {
  localStorage.removeItem(LOGIN_KEY);
  document.querySelector('main').style.display = 'none';
  document.getElementById('login-panel').style.display = 'block';
  document.getElementById('form-login').reset();
}

// Manejo del login
document.getElementById('form-login').onsubmit = function(e) {
  e.preventDefault();
  const pass = document.getElementById('admin-pass').value;
  if (pass === getClave()) {
    document.getElementById('login-panel').style.display = 'none';
    document.querySelector('main').style.display = 'block';
    localStorage.setItem(LOGIN_KEY, "1");
    resetSessionTimer();
  } else {
    document.getElementById('login-error').textContent = "Contraseña incorrecta.";
  }
};

// Restaurar sesión si ya estaba logeado
if (localStorage.getItem(LOGIN_KEY) === "1") {
  document.getElementById('login-panel').style.display = 'none';
  document.querySelector('main').style.display = 'block';
  resetSessionTimer();
}

// Reiniciar timer al haber actividad
window.onmousemove = resetSessionTimer;
window.onkeydown   = resetSessionTimer;


// --- Cambiar contraseña ---
function mostrarCambiarClave() {
  const modal = document.getElementById('modal-clave');
  modal.innerHTML = `
    <h3>Cambiar Contraseña</h3>
    <form id="form-cambiar-clave">
      <label>Contraseña actual:<br><input type="password" id="clave-actual" required></label><br><br>
      <label>Nueva contraseña:<br><input type="password" id="clave-nueva" required></label><br><br>
      <button type="submit">Cambiar</button>
      <button type="button" onclick="modal.style.display='none'">Cancelar</button>
      <p id="msg-clave" style="color:#b71c1c;"></p>
    </form>`;
  modal.style.display = 'block';

  document.getElementById('form-cambiar-clave').onsubmit = function(e) {
    e.preventDefault();
    const actual = document.getElementById('clave-actual').value;
    const nueva  = document.getElementById('clave-nueva').value;
    if (actual !== getClave()) {
      document.getElementById('msg-clave').textContent = "Contraseña actual incorrecta.";
    } else {
      localStorage.setItem(CLAVE_KEY, nueva);
      modal.innerHTML = "<b>Contraseña cambiada exitosamente.</b>";
      setTimeout(() => modal.style.display = 'none', 1500);
    }
  };
}


// --- Gestión de productos ---
let productos = JSON.parse(localStorage.getItem('productosCafeteria') || "[]");

function renderProductos() {
  const tbody = document.querySelector('#tabla-productos tbody');
  tbody.innerHTML = '';
  productos.forEach((prod, idx) => {
    tbody.innerHTML += `
      <tr>
        <td><img src="${prod.imagen || ''}" style="width:40px;height:40px;border-radius:8px;"></td>
        <td>${prod.nombre}</td>
        <td>$${prod.precio.toFixed(2)}</td>
        <td>
          ${prod.stock}
          ${prod.stock <= 3 ? '<span style="color:#b71c1c;font-weight:bold;"> ¡Bajo!</span>' : ''}
        </td>
        <td>
          <input type="number" id="sumar${idx}" min="1" style="width:50px;">
          <button onclick="sumarStock(${idx})">Sumar</button>
        </td>
        <td>
          <button onclick="editarProducto(${idx})">Editar</button>
          <button onclick="eliminarProducto(${idx})" style="background:#b71c1c;color:#fff;">Eliminar</button>
        </td>
      </tr>`;
  });
}

// Guardar o actualizar producto
document.getElementById('form-producto').onsubmit = function(e) {
  e.preventDefault();
  const id     = document.getElementById('prod-id').value;
  const nombre = document.getElementById('prod-nombre').value.trim();
  const precio = parseFloat(document.getElementById('prod-precio').value);
  const stock  = parseInt(document.getElementById('prod-stock').value);
  let   imagen = document.getElementById('preview-img').src;

  if (!imagen || imagen === window.location.href) {
    imagen = id ? productos[id].imagen : '';
  }

  const prodObj = { nombre, precio, stock, imagen };
  if (id !== '') {
    productos[id] = { ...productos[id], ...prodObj };
  } else {
    productos.push(prodObj);
  }
  localStorage.setItem('productosCafeteria', JSON.stringify(productos));
  limpiarFormulario();
  renderProductos();
};

// Preview de imagen al seleccionar
document.getElementById('prod-imagen').addEventListener('change', function(e) {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = evt => {
      const img = document.getElementById('preview-img');
      img.src = evt.target.result;
      img.style.display = 'inline';
    };
    reader.readAsDataURL(file);
  }
});

function editarProducto(idx) {
  const p = productos[idx];
  document.getElementById('prod-id').value     = idx;
  document.getElementById('prod-nombre').value = p.nombre;
  document.getElementById('prod-precio').value = p.precio;
  document.getElementById('prod-stock').value  = p.stock;
  const img = document.getElementById('preview-img');
  img.src = p.imagen; img.style.display = p.imagen ? 'inline' : 'none';
}

function eliminarProducto(idx) {
  if (confirm("¿Seguro de eliminar este producto?")) {
    productos.splice(idx, 1);
    localStorage.setItem('productosCafeteria', JSON.stringify(productos));
    renderProductos();
  }
}

function limpiarFormulario() {
  document.getElementById('form-producto').reset();
  document.getElementById('prod-id').value = '';
  const img = document.getElementById('preview-img');
  img.src = ''; img.style.display = 'none';
}

function sumarStock(idx) {
  const val = parseInt(document.getElementById('sumar'+idx).value);
  if (!isNaN(val) && val > 0) {
    productos[idx].stock += val;
    localStorage.setItem('productosCafeteria', JSON.stringify(productos));
    renderProductos();
  }
}


// --- Historial de ventas ---
function buscarVentas() {
  const desde  = document.getElementById('ventas-desde').value;
  const hasta  = document.getElementById('ventas-hasta').value;
  const mesa   = document.getElementById('ventas-mesa').value;
  const prod   = document.getElementById('ventas-prod').value.trim().toLowerCase();
  const cliente= document.getElementById('ventas-cliente').value.trim().toLowerCase();

  const ventasAll = JSON.parse(localStorage.getItem('ventasDiarias') || "{}");
  let ventas = [];
  for (const fecha in ventasAll) {
    if ((!desde  || fecha >= desde) &&
        (!hasta  || fecha <= hasta)) {
      ventas = ventas.concat(ventasAll[fecha].map(v=>({...v, fecha})));
    }
  }
  if (mesa)    ventas = ventas.filter(v=>v.numeroMesa   == mesa);
  if (cliente)ventas = ventas.filter(v=>v.nombreCliente.toLowerCase().includes(cliente));
  if (prod)    ventas = ventas.filter(v=>v.pedido.some(i=>i.nombre.toLowerCase().includes(prod)));

  const cont = document.getElementById('tabla-ventas');
  if (!ventas.length) {
    cont.innerHTML = "<b>No hay ventas con esos criterios.</b>";
    return;
  }
  let html = `<table border="1" cellpadding="6"><thead>
    <tr><th>Fecha</th><th>Mesa</th><th>Cliente</th><th>Hora</th><th>Productos</th><th>Total</th></tr>
  </thead><tbody>`;
  ventas.forEach(v=>{
    const total = v.pedido.reduce((a,i)=>a + i.precio*i.cantidad,0);
    html += `<tr>
      <td>${v.fecha}</td>
      <td>${v.numeroMesa}</td>
      <td>${v.nombreCliente}</td>
      <td>${v.hora}</td>
      <td><ul style="padding-left:18px;">${
        v.pedido.map(item=>`<li>${item.nombre} x${item.cantidad} ($${item.precio.toFixed(2)})</li>`).join('')
      }</ul></td>
      <td>$${total.toFixed(2)}</td>
    </tr>`;
  });
  html += `</tbody></table>`;
  cont.innerHTML = html;
}

function exportarVentasCSV() {
  const desde  = document.getElementById('ventas-desde').value;
  const hasta  = document.getElementById('ventas-hasta').value;
  const mesa   = document.getElementById('ventas-mesa').value;
  const prod   = document.getElementById('ventas-prod').value.trim().toLowerCase();
  const cliente= document.getElementById('ventas-cliente').value.trim().toLowerCase();

  const ventasAll = JSON.parse(localStorage.getItem('ventasDiarias') || "{}");
  let ventas = [];
  for (const fecha in ventasAll) {
    if ((!desde  || fecha >= desde) &&
        (!hasta  || fecha <= hasta)) {
      ventas = ventas.concat(ventasAll[fecha].map(v=>({...v, fecha})));
    }
  }
  if (mesa)    ventas = ventas.filter(v=>v.numeroMesa   == mesa);
  if (cliente)ventas = ventas.filter(v=>v.nombreCliente.toLowerCase().includes(cliente));
  if (prod)    ventas = ventas.filter(v=>v.pedido.some(i=>i.nombre.toLowerCase().includes(prod)));

  if (!ventas.length) {
    alert("No hay ventas para exportar.");
    return;
  }

  let csv = "Fecha,Mesa,Cliente,Hora,Producto,Cantidad,Unitario,Subtotal\n";
  ventas.forEach(v=>{
    v.pedido.forEach(item=>{
      csv += `${v.fecha},${v.numeroMesa},${v.nombreCliente},${v.hora},"${item.nombre}",${item.cantidad},${item.precio},${(item.precio*item.cantidad).toFixed(2)}\n`;
    });
  });

  const blob = new Blob([csv], { type: "text/csv" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `ventas_${desde||'ini'}_a_${hasta||'fin'}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}


// --- Generación de QR ---
function generarQRMesas() {
  const total = parseInt(document.getElementById('total-mesas').value) || 1;
  const cont  = document.getElementById('qrs-mesas');
  cont.innerHTML = '';
  for (let i = 1; i <= total; i++) {
    const url = `https://elsaborcolombiano.com/index.html?mesa=${i}`;
    cont.innerHTML += `
      <div style="border:1px solid #ddd;padding:0.8em;text-align:center;">
        <b>Mesa ${i}</b><br>
        <img src="https://api.qrserver.com/v1/create-qr-code/?size=130x130&data=${encodeURIComponent(url)}"><br>
        <small style="word-break:break-all;">${url}</small>
      </div>`;
  }
}


// --- Inicialización ---
renderProductos();
