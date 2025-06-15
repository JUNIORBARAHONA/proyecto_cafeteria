// --- INICIALIZAR MENÚ SOLO SI ESTÁ VACÍO ---
if (!localStorage.getItem('productosCafeteria')) {
    const productosEjemplo = [
        { nombre: 'Papas rellenas', categoria: 'Papas', precio: 2.50, stock: 20, imagen: 'img/papas_rellenas.jpg' },
        { nombre: 'Empanadas de pollo', categoria: 'Empanadas', precio: 2.00, stock: 25, imagen: 'img/empanada_pollo.jpg' },
        { nombre: 'Empanadas de carne', categoria: 'Empanadas', precio: 2.00, stock: 25, imagen: 'img/empanada_carne.jpg' },
        { nombre: 'Empanadas rancheras', categoria: 'Empanadas', precio: 2.50, stock: 20, imagen: 'img/empanada_ranchera.jpg' },
        { nombre: 'Arepas carne', categoria: 'Arepas', precio: 2.80, stock: 20, imagen: 'img/arepa_carne.jpg' },
        { nombre: 'Arepas queso', categoria: 'Arepas', precio: 2.80, stock: 20, imagen: 'img/arepa_queso.jpg' },
        { nombre: 'Avena', categoria: 'Bebidas', precio: 1.50, stock: 30, imagen: 'img/avena.jpg' },
        { nombre: 'Jugo de mora', categoria: 'Jugos', precio: 2.20, stock: 18, imagen: 'img/jugo_mora.jpg' },
        { nombre: 'Jugo de guanábana', categoria: 'Jugos', precio: 2.20, stock: 18, imagen: 'img/jugo_guanabana.jpg' },
        { nombre: 'Jugo de tomate de árbol', categoria: 'Jugos', precio: 2.20, stock: 18, imagen: 'img/jugo_tomate.jpg' },
        { nombre: 'Jugo de guayaba', categoria: 'Jugos', precio: 2.20, stock: 18, imagen: 'img/jugo_guayaba.jpg' },
        { nombre: 'Café', categoria: 'Café', precio: 1.20, stock: 40, imagen: 'img/cafe.jpg' },
        { nombre: 'Café en leche', categoria: 'Café', precio: 1.50, stock: 40, imagen: 'img/cafe_leche.jpg' },
        { nombre: 'Chocolate', categoria: 'Café', precio: 1.50, stock: 35, imagen: 'img/chocolate.jpg' }
    ];
    localStorage.setItem('productosCafeteria', JSON.stringify(productosEjemplo));
}

// Datos del negocio
const NEGOCIO_NOMBRE = "El Sabor Colombiano";
const NEGOCIO_NIT = "NIT 123456789-0";
const NEGOCIO_DIRECCION = "Calle 123 #45-67, Bogotá";
const NEGOCIO_TELEFONO = "Tel: 300 000 0000";
const NEGOCIO_MENSAJE = "¡Gracias por tu compra!";

// Variables principales
let productos = JSON.parse(localStorage.getItem('productosCafeteria') || "[]");
let pedido = [];
let nombreCliente = '';
let numeroMesa = '';
let NUM_FACTURA = null;
let ultimoPedidoEnviado = null;
let categoriaActual = 'Todas';

// Leer mesa de la URL (QR)
window.onload = function() {
  const params = new URLSearchParams(window.location.search);
  if(params.has('mesa')) {
    document.getElementById('numeroMesa').value = params.get('mesa');
    document.getElementById('numeroMesa').readOnly = true;
  }
}

// Manejar login de nombre y mesa
document.getElementById('form-identificacion').addEventListener('submit', function(e) {
    e.preventDefault();
    nombreCliente = document.getElementById('nombreCliente').value.trim();
    numeroMesa = document.getElementById('numeroMesa').value.trim();
    if (nombreCliente && numeroMesa) {
        document.getElementById('identificacion').style.display = 'none';
        document.getElementById('seccionMenu').style.display = 'block';
        cargarProductos();
    }
});

function cargarProductos() {
    productos = JSON.parse(localStorage.getItem('productosCafeteria') || "[]");
    mostrarFiltrosCategoria();
    mostrarProductos();
}

// --- Filtros por categoría ---
function mostrarFiltrosCategoria() {
    const categorias = [...new Set(productos.map(p => p.categoria).filter(c => !!c && c !== "undefined"))];
    let html = `<button class="btn-generar${categoriaActual === 'Todas' ? ' seleccionado' : ''}" onclick="filtrarPorCategoria('Todas')">Todas</button> `;
    categorias.forEach(cat => {
        html += `<button class="btn-generar${categoriaActual === cat ? ' seleccionado' : ''}" onclick="filtrarPorCategoria('${cat}')">${cat}</button> `;
    });
    document.getElementById('filtros-categoria').innerHTML = html;
}

function filtrarPorCategoria(cat) {
    categoriaActual = cat;
    mostrarProductos();
    mostrarFiltrosCategoria();
}

// --- Mostrar productos filtrados ---
function mostrarProductos() {
    const contenedor = document.getElementById('productos-lista');
    contenedor.innerHTML = '';
    let filtrados = productos;
    if (categoriaActual !== 'Todas') {
        filtrados = productos.filter(p => p.categoria === categoriaActual);
    }
    filtrados.forEach((prod) => {
        if (prod.stock > 0) {
            contenedor.innerHTML += `
                <div class="producto-card">
                    <img src="${prod.imagen ? prod.imagen : 'img/placeholder.png'}" alt="${prod.nombre}">
                    <h4>${prod.nombre}</h4>
                    <p><b>$${prod.precio.toFixed(2)}</b></p>
                    <button onclick="agregarAlPedidoPorNombre('${prod.nombre.replace(/'/g, "\\'")}')">Agregar</button>
                </div>
            `;
        }
    });
}

function agregarAlPedidoPorNombre(nombre) {
    const prod = productos.find(p => p.nombre === nombre);
    if (!prod) return;
    const enPedido = pedido.find(p => p.nombre === prod.nombre);
    const enCarrito = enPedido ? enPedido.cantidad : 0;
    if (prod.stock - enCarrito <= 0) {
        alert("No hay más stock de este producto.");
        return;
    }
    if (enPedido) {
        enPedido.cantidad += 1;
    } else {
        pedido.push({ ...prod, cantidad: 1 });
    }
    mostrarPedido();
}

function mostrarPedido() {
    const lista = document.getElementById('pedido-lista');
    lista.innerHTML = '';
    pedido.forEach(item => {
        lista.innerHTML += `
            <li>
                ${item.nombre} x${item.cantidad} - $${(item.precio * item.cantidad).toFixed(2)}
                <button onclick="eliminarDelPedido('${item.nombre}')" style="float:right;background:#b71c1c;padding:2px 8px;font-size:0.9em;">X</button>
            </li>
        `;
    });
}

function eliminarDelPedido(nombre) {
    pedido = pedido.filter(item => item.nombre !== nombre);
    mostrarPedido();
}

function enviarPedido() {
    if (pedido.length === 0) {
        alert('¡Agrega productos al pedido!');
        return;
    }
    const pedidos = JSON.parse(localStorage.getItem('pedidosCafeteria') || "[]");
    let pedidoActual = {
        nombreCliente,
        numeroMesa,
        pedido: pedido.map(x=>({...x})),
        hora: new Date().toLocaleTimeString()
    };
    pedidos.push(pedidoActual);
    localStorage.setItem('pedidosCafeteria', JSON.stringify(pedidos));
    ultimoPedidoEnviado = pedidoActual;
    document.getElementById('seccionMenu').style.display = 'none';
    document.getElementById('mensajePedido').style.display = 'block';
    pedido = [];
    mostrarPedido();
}

// ---- Módulo Llamar mesero / pedir cuenta ----
function enviarSolicitud(tipo) {
  const solicitudes = JSON.parse(localStorage.getItem('solicitudesMesero') || "[]");
  solicitudes.push({
    tipo,
    nombreCliente,
    numeroMesa,
    hora: new Date().toLocaleTimeString(),
    atendida: false
  });
  localStorage.setItem('solicitudesMesero', JSON.stringify(solicitudes));
  alert("Tu solicitud ha sido enviada.");
}

function llamarMesero() {
  enviarSolicitud("Mesero");
}

function pedirCuenta() {
  enviarSolicitud("Cuenta");
  document.getElementById('extra-factura').style.display = "block";
  document.getElementById('btn-imprimir-factura').style.display = "inline-block";
  document.getElementById('btn-whatsapp-factura').style.display = "inline-block";
  document.getElementById('btn-correo-factura').style.display = "inline-block";
  generarFacturaCliente();
}

// ---- Facturación (consecutivo, observaciones, propina, impresión, whatsapp, correo) ----
function getNextFacturaNum() {
  let num = parseInt(localStorage.getItem("numFactura") || "1001");
  localStorage.setItem("numFactura", (num + 1).toString());
  return num;
}

function generarFacturaCliente() {
  let pedidoObj = ultimoPedidoEnviado;
  if (!pedidoObj) {
    alert("No se encontró el pedido para facturar.");
    return;
  }
  NUM_FACTURA = getNextFacturaNum();
  let total = pedidoObj.pedido.reduce((acc, item) => acc + item.precio * item.cantidad, 0);
  const obs = document.getElementById('factura-observaciones') ? document.getElementById('factura-observaciones').value.trim() : '';
  const propina = document.getElementById('factura-propina') ? parseFloat(document.getElementById('factura-propina').value) || 0 : 0;
  let totalConPropina = total + propina;

  let html = `<div id="factura-contenido" style="max-width:340px;margin:auto;font-family:'Segoe UI',Arial,sans-serif;">
    <div style="text-align:center;">
      <img src="img/logo.png" style="width:70px;border-radius:50%;margin-bottom:0.3em;">
      <h2 style="margin:0;">${NEGOCIO_NOMBRE}</h2>
      <div style="font-size:0.98em;">${NEGOCIO_NIT}<br>
        ${NEGOCIO_DIRECCION}<br>
        ${NEGOCIO_TELEFONO}
      </div>
    </div>
    <hr>
    <table style="width:100%;font-size:0.98em;margin:0;">
      <tr>
        <td><b>Factura #:</b> ${NUM_FACTURA}</td>
        <td style="text-align:right;"><b>Hora:</b> ${pedidoObj.hora}</td>
      </tr>
      <tr>
        <td><b>Mesa:</b> ${pedidoObj.numeroMesa}</td>
        <td style="text-align:right;"><b>Cliente:</b> ${pedidoObj.nombreCliente}</td>
      </tr>
    </table>
    <hr>
    <table style="width:100%;margin:1em 0;border-collapse:collapse;font-size:0.97em;">
      <tr>
        <th style="text-align:left;">Producto</th>
        <th>Cant.</th>
        <th>Unitario</th>
        <th>Subtotal</th>
      </tr>`;
  pedidoObj.pedido.forEach(item => {
    html += `<tr>
      <td>${item.nombre}</td>
      <td style="text-align:center;">${item.cantidad}</td>
      <td style="text-align:right;">$${item.precio.toFixed(2)}</td>
      <td style="text-align:right;">$${(item.precio * item.cantidad).toFixed(2)}</td>
    </tr>`;
  });
  html += `</table>
    ${propina > 0 ? `<div style="text-align:right;">Propina: <b>$${propina.toFixed(2)}</b></div>` : ""}
    <hr>
    <div style="text-align:right;font-size:1.1em;"><b>Total: $${totalConPropina.toFixed(2)}</b></div>
    ${obs ? `<div style="margin-top:1em;"><b>Observaciones:</b> ${obs}</div>` : ""}
    <div style="text-align:center;margin-top:1.5em;font-size:1.06em;"><i>${NEGOCIO_MENSAJE}</i></div>
  </div>`;

  document.getElementById('factura-modal').innerHTML = html;
  document.getElementById('factura-modal').style.display = "block";
}

function imprimirFactura() {
    let contenido = document.getElementById('factura-contenido').innerHTML;
    let ventana = window.open('', '', 'height=600,width=400');
    if (!ventana) {
        alert("Tu navegador bloqueó la ventana emergente. Habilita los pop-ups para imprimir la factura.");
        return;
    }
    ventana.document.write('<html><head><title>Factura - El Sabor Colombiano</title>');
    ventana.document.write('<link rel="stylesheet" href="styles.css"></head><body>');
    ventana.document.write(contenido);
    ventana.document.write('</body></html>');
    ventana.document.close();
    ventana.focus();
    setTimeout(() => {
        ventana.print();
        ventana.close();
    }, 300);
}


function enviarPorWhatsApp() {
  let pedidoObj = ultimoPedidoEnviado;
  let total = pedidoObj.pedido.reduce((acc, item) => acc + item.precio * item.cantidad, 0);
  const obs = document.getElementById('factura-observaciones') ? document.getElementById('factura-observaciones').value.trim() : '';
  const propina = document.getElementById('factura-propina') ? parseFloat(document.getElementById('factura-propina').value) || 0 : 0;
  let totalConPropina = total + propina;
  let msg = `Factura ${NUM_FACTURA}%0A${NEGOCIO_NOMBRE}%0A${NEGOCIO_DIRECCION}%0A${NEGOCIO_TELEFONO}%0A---%0ACliente: ${pedidoObj.nombreCliente}%0AMesa: ${pedidoObj.numeroMesa}%0A${pedidoObj.pedido.map(item=>`${item.nombre} x${item.cantidad}: $${(item.precio*item.cantidad).toFixed(2)}`).join("%0A")}%0APropina: $${propina.toFixed(2)}%0ATotal: $${totalConPropina.toFixed(2)}%0A${NEGOCIO_MENSAJE}${obs ? `%0AObservaciones: ${obs}` : ""}`;
  window.open(`https://wa.me/?text=${msg}`,'_blank');
}

function enviarPorCorreo() {
  let asunto = `Factura ${NUM_FACTURA} - ${NEGOCIO_NOMBRE}`;
  let cuerpo = document.getElementById('factura-contenido').innerText;
  window.open(`mailto:?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`);
}
