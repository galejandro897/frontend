const axios = require('axios');
const Chart = require('chart.js/auto');

const backendUrl = 'http://192.168.0.13:3000';
let token = null;
let isAdmin = false;
let area = null;

async function iniciarSesion() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const response = await axios.post(`${backendUrl}/login`, { email, password });
        token = response.data.token;
        isAdmin = response.data.rol === 'admin';
        area = response.data.area;

        document.getElementById('loginResultado').innerText = 'Inicio de sesión exitoso';
        document.getElementById('loginContainer').style.display = 'none';
        document.getElementById('mainContainer').style.display = 'block';

        if (isAdmin) {
            const adminTabs = document.getElementsByClassName('admin-only');
            for (let i = 0; i < adminTabs.length; i++) {
                adminTabs[i].style.display = 'block';
            }
        }

        // Controlar visibilidad de pestañas según el área
        if (area === 'almacen') {
            const generalTabs = document.getElementsByClassName('general-tab');
            for (let i = 0; i < generalTabs.length; i++) {
                generalTabs[i].style.display = 'none';
            }
            const almacenTabs = document.getElementsByClassName('almacen-tab');
            for (let i = 0; i < almacenTabs.length; i++) {
                almacenTabs[i].style.display = 'block';
            }
            // Abrir automáticamente la pestaña de almacén
            document.getElementById('almacen').classList.add('active');
            const tabs = document.getElementsByClassName('almacen-tab');
            for (let i = 0; i < tabs.length; i++) {
                tabs[i].classList.add('active');
            }
        } else {
            const generalTabs = document.getElementsByClassName('general-tab');
            for (let i = 0; i < generalTabs.length; i++) {
                generalTabs[i].style.display = 'block';
            }
            const almacenTabs = document.getElementsByClassName('almacen-tab');
            for (let i = 0; i < almacenTabs.length; i++) {
                almacenTabs[i].style.display = 'block';
            }
        }

        // Cargar proveedores al iniciar
        cargarProveedores();
        cargarDashboard();
    } catch (error) {
        document.getElementById('loginResultado').innerText = `Error: ${error.response ? error.response.data.error : error.message}`;
    }
}

async function registrarVenta() {
    const venta = {
        usuario: document.getElementById('ventaUsuario').value,
        turno: document.getElementById('ventaTurno').value,
        producto: document.getElementById('ventaProducto').value,
        cantidad: parseInt(document.getElementById('ventaCantidad').value),
        precio: parseFloat(document.getElementById('ventaPrecio').value),
        pago: document.getElementById('ventaPago').value,
        sucursal_id: 1
    };

    try {
        const response = await axios.post(`${backendUrl}/ventas`, venta);
        document.getElementById('ventaResultado').innerText = 'Venta registrada';
    } catch (error) {
        document.getElementById('ventaResultado').innerText = `Error: ${error.message}`;
    }
}

async function registrarInventario() {
    const cantidadKg = parseInt(document.getElementById('inventarioCantidad').value);
    const cantidadGramos = cantidadKg * 1000; // Conversión automática de kg a gramos
    const fotoInput = document.getElementById('inventarioFoto');
    const foto = fotoInput.files.length > 0 ? fotoInput.files[0].path : '';

    const inventario = {
        sucursal_id: 1,
        producto: document.getElementById('inventarioProducto').value,
        cantidad_inicial: cantidadKg,
        usuario: 'Ana',
        fecha_vencimiento: document.getElementById('inventarioFechaVencimiento').value,
        foto: foto,
        checklist: document.getElementById('inventarioChecklist').value,
        firma: document.getElementById('inventarioFirma').value
    };

    try {
        const response = await axios.post(`${backendUrl}/inventario`, inventario);
        document.getElementById('inventarioResultado').innerText = `Inventario registrado. ${cantidadKg} kg = ${cantidadGramos} gramos`;
        cargarDashboard();
    } catch (error) {
        document.getElementById('inventarioResultado').innerText = `Error: ${error.message}`;
    }
}

async function verVencimientos() {
    try {
        const response = await axios.get(`${backendUrl}/inventario-vencimientos`);
        const vencimientos = response.data;
        const tbody = document.getElementById('vencimientosCuerpo');
        tbody.innerHTML = '';

        vencimientos.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.producto}</td>
                <td>${item.cantidad_inicial}</td>
                <td>${item.fecha_vencimiento}</td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        document.getElementById('vencimientosCuerpo').innerHTML = `<tr><td colspan="3">Error: ${error.message}</td></tr>`;
    }
}

async function cerrarCaja() {
    const cierre = {
        usuario: document.getElementById('cierreUsuario').value,
        turno: document.getElementById('cierreTurno').value,
        efectivo: parseFloat(document.getElementById('cierreEfectivo').value),
        tarjeta: parseFloat(document.getElementById('cierreTarjeta').value),
        encargado: document.getElementById('cierreEncargado').value,
        sucursal_id: 1
    };

    try {
        const response = await axios.post(`${backendUrl}/cierre-caja`, cierre);
        document.getElementById('cierreResultado').innerText = 'Caja cerrada. Diferencia: $0.00';
    } catch (error) {
        document.getElementById('cierreResultado').innerText = `Error: ${error.message}`;
    }
}

async function verReporte() {
    const turno = document.getElementById('reporteTurno').value;

    try {
        const response = await axios.get(`${backendUrl}/reporte?turno=${turno}`);
        const ventas = response.data;
        const tbody = document.getElementById('reporteCuerpo');
        tbody.innerHTML = '';

        ventas.forEach(venta => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${venta.producto}</td>
                <td>${venta.cantidad}</td>
                <td>${venta.precio}</td>
                <td>${venta.usuario}</td>
                <td>${venta.turno}</td>
            `;
            tbody.appendChild(row);
        });

        const chartResponse = await axios.get(`${backendUrl}/reporte-por-producto`);
        const datos = chartResponse.data;
        const labels = datos.map(item => item.producto);
        const valores = datos.map(item => item.total_vendido);

        const ctx = document.getElementById('ventasChart').getContext('2d');
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Total Vendido',
                    data: valores,
                    backgroundColor: '#E63946',
                    borderColor: '#F77F00',
                    borderWidth: 1
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    } catch (error) {
        document.getElementById('reporteCuerpo').innerHTML = `<tr><td colspan="5">Error: ${error.message}</td></tr>`;
    }
}

async function verMejoresDias() {
    try {
        const response = await axios.get(`${backendUrl}/mejores-dias/1`);
        const dias = response.data;
        const tbody = document.getElementById('mejoresDiasCuerpo');
        tbody.innerHTML = '';

        dias.forEach(dia => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${dia.dia}</td>
                <td>${dia.turno}</td>
                <td>${dia.ingresos}</td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        document.getElementById('mejoresDiasCuerpo').innerHTML = `<tr><td colspan="3">Error: ${error.message}</td></tr>`;
    }
}

async function registrarDespachador() {
    if (!isAdmin) {
        document.getElementById('despachadorResultado').innerText = 'Error: Solo el administrador puede registrar despachadores';
        return;
    }

    const despachador = {
        nombre: document.getElementById('despachadorNombre').value,
        rol: document.getElementById('despachadorRol').value,
        sucursal_id: 1
    };

    try {
        const response = await axios.post(`${backendUrl}/despachadores`, despachador, {
            headers: { Authorization: token }
        });
        document.getElementById('despachadorResultado').innerText = 'Despachador registrado';
    } catch (error) {
        document.getElementById('despachadorResultado').innerText = `Error: ${error.response ? error.response.data.error : error.message}`;
    }
}

async function verDespachadores() {
    try {
        const response = await axios.get(`${backendUrl}/despachadores`);
        const despachadores = response.data;
        const tbody = document.getElementById('despachadoresCuerpo');
        tbody.innerHTML = '';

        despachadores.forEach(despachador => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${despachador.nombre}</td>
                <td>${despachador.rol}</td>
                <td>${despachador.sucursal_id}</td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        document.getElementById('despachadoresCuerpo').innerHTML = `<tr><td colspan="3">Error: ${error.message}</td></tr>`;
    }
}

async function registrarEmpleado() {
    if (!isAdmin) {
        document.getElementById('empleadoResultado').innerText = 'Error: Solo el administrador puede registrar empleados';
        return;
    }

    const empleado = {
        nombre: document.getElementById('empleadoNombre').value,
        rol: document.getElementById('empleadoRol').value,
        area: document.getElementById('empleadoArea').value,
        sucursal_id: 1,
        email: document.getElementById('empleadoEmail').value,
        password: document.getElementById('empleadoPassword').value
    };

    try {
        const response = await axios.post(`${backendUrl}/empleados`, empleado, {
            headers: { Authorization: token }
        });
        document.getElementById('empleadoResultado').innerText = 'Empleado registrado';
    } catch (error) {
        document.getElementById('empleadoResultado').innerText = `Error: ${error.response ? error.response.data.error : error.message}`;
    }
}

async function verEmpleados() {
    try {
        const response = await axios.get(`${backendUrl}/empleados`);
        const empleados = response.data;
        const tbody = document.getElementById('empleadosCuerpo');
        tbody.innerHTML = '';

        empleados.forEach(empleado => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${empleado.nombre}</td>
                <td>${empleado.rol}</td>
                <td>${empleado.area}</td>
                <td>${empleado.sucursal_id}</td>
                <td>${empleado.email}</td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        document.getElementById('empleadosCuerpo').innerHTML = `<tr><td colspan="5">Error: ${error.message}</td></tr>`;
    }
}

async function registrarPedido() {
    const pedido = {
        usuario: document.getElementById('pedidoUsuario').value,
        producto: document.getElementById('pedidoProducto').value,
        cantidad: parseInt(document.getElementById('pedidoCantidad').value),
        mesa: document.getElementById('pedidoMesa').value,
        sucursal_id: 1
    };

    try {
        const response = await axios.post(`${backendUrl}/pedidos`, pedido);
        document.getElementById('pedidoResultado').innerText = 'Pedido registrado';
    } catch (error) {
        document.getElementById('pedidoResultado').innerText = `Error: ${error.message}`;
    }
}

async function verOrdenes() {
    try {
        const response = await axios.get(`${backendUrl}/pedidos`);
        const pedidos = response.data;
        const tbody = document.getElementById('ordenesCuerpo');
        tbody.innerHTML = '';

        pedidos.forEach(pedido => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${pedido.usuario}</td>
                <td>${pedido.producto}</td>
                <td>${pedido.cantidad}</td>
                <td>${pedido.mesa}</td>
                <td>${pedido.estado}</td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        document.getElementById('ordenesCuerpo').innerHTML = `<tr><td colspan="5">Error: ${error.message}</td></tr>`;
    }
}

async function agregarPuntos() {
    const gamificacion = {
        empleado_id: parseInt(document.getElementById('gamificacionEmpleadoId').value),
        puntos: parseInt(document.getElementById('gamificacionPuntos').value)
    };

    try {
        const response = await axios.post(`${backendUrl}/gamificacion/puntos`, gamificacion);
        document.getElementById('gamificacionResultado').innerText = 'Puntos agregados';
    } catch (error) {
        document.getElementById('gamificacionResultado').innerText = `Error: ${error.message}`;
    }
}

async function verLeaderboard() {
    try {
        const response = await axios.get(`${backendUrl}/gamificacion/leaderboard`);
        const leaderboard = response.data;
        const tbody = document.getElementById('leaderboardCuerpo');
        tbody.innerHTML = '';

        leaderboard.forEach(entry => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${entry.nombre}</td>
                <td>${entry.total_puntos}</td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        document.getElementById('leaderboardCuerpo').innerHTML = `<tr><td colspan="2">Error: ${error.message}</td></tr>`;
    }
}

async function cargarProveedores() {
    try {
        const response = await axios.get(`${backendUrl}/proveedores`);
        const proveedores = response.data;
        const select = document.getElementById('almacenProveedor');
        select.innerHTML = '';
        proveedores.forEach(proveedor => {
            const option = document.createElement('option');
            option.value = proveedor.id;
            option.text = proveedor.nombre;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Error cargando proveedores:', error);
    }
}

async function registrarCompra() {
    const compra = {
        proveedor_id: parseInt(document.getElementById('almacenProveedor').value),
        producto: document.getElementById('almacenCompraProducto').value,
        cantidad: parseInt(document.getElementById('almacenCompraCantidad').value),
        precio: parseFloat(document.getElementById('almacenCompraPrecio').value)
    };

    try {
        const response = await axios.post(`${backendUrl}/compras`, compra);
        document.getElementById('almacenCompraResultado').innerText = 'Compra registrada';
    } catch (error) {
        document.getElementById('almacenCompraResultado').innerText = `Error: ${error.message}`;
    }
}

async function generarMensajeCompra() {
    const proveedorId = document.getElementById('almacenProveedor').value;
    const producto = document.getElementById('almacenCompraProducto').value;
    const cantidad = document.getElementById('almacenCompraCantidad').value;

    try {
        const response = await axios.get(`${backendUrl}/proveedores`);
        const proveedor = response.data.find(p => p.id == proveedorId);
        const mensaje = `Hola ${proveedor.nombre}, necesito ${cantidad} kg de ${producto}. ¿Me puedes confirmar disponibilidad y precio? Gracias!`;
        document.getElementById('almacenMensaje').innerText = mensaje;
    } catch (error) {
        document.getElementById('almacenMensaje').innerText = `Error: ${error.message}`;
    }
}

async function verCompras() {
    try {
        const response = await axios.get(`${backendUrl}/compras`);
        const compras = response.data;
        const tbody = document.getElementById('comprasCuerpo');
        tbody.innerHTML = '';

        compras.forEach(compra => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${compra.proveedor}</td>
                <td>${compra.producto}</td>
                <td>${compra.cantidad}</td>
                <td>${compra.precio}</td>
                <td>${compra.fecha}</td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        document.getElementById('comprasCuerpo').innerHTML = `<tr><td colspan="5">Error: ${error.message}</td></tr>`;
    }
}

async function verMerma() {
    try {
        const response = await axios.get(`${backendUrl}/merma`);
        const merma = response.data;
        const tbody = document.getElementById('mermaCuerpo');
        tbody.innerHTML = '';

        merma.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.producto}</td>
                <td>${item.merma}</td>
                <td>${item.porcentaje}%</td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        document.getElementById('mermaCuerpo').innerHTML = `<tr><td colspan="3">Error: ${error.message}</td></tr>`;
    }
}

async function verConsumoTemporada() {
    try {
        const response = await axios.get(`${backendUrl}/consumo-temporada`);
        const datos = response.data;
        const meses = [...new Set(datos.map(item => item.mes))];
        const productos = [...new Set(datos.map(item => item.producto))];

        const datasets = productos.map(producto => {
            return {
                label: producto,
                data: meses.map(mes => {
                    const item = datos.find(d => d.mes === mes && d.producto === producto);
                    return item ? item.total_consumo : 0;
                }),
                borderColor: producto === 'Pollo Rostizado' ? '#4682B4' : '#8FBC8F',
                fill: false
            };
        });

        const ctx = document.getElementById('consumoChart').getContext('2d');
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: meses,
                datasets: datasets
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error cargando consumo por temporada:', error);
    }
}

async function cargarDashboard() {
    try {
        const ventasResponse = await axios.get(`${backendUrl}/ventas-hoy`);
        document.getElementById('totalVentas').innerText = ventasResponse.data.total;

        const inventarioResponse = await axios.get(`${backendUrl}/inventario/Pollo Rostizado`);
        const stock = inventarioResponse.data.cantidad;
        document.getElementById('inventarioPollo').innerText = stock;
        document.getElementById('almacenInventarioPollo').innerText = stock;

        if (stock < 5) {
            const mensaje = '¡Alerta! Stock bajo de Pollo Rostizado';
            document.getElementById('stockAlerta').innerText = mensaje;
            document.getElementById('stockAlerta').classList.add('alert');
            document.getElementById('almacenStockAlerta').innerText = mensaje;
        } else {
            document.getElementById('stockAlerta').innerText = '';
            document.getElementById('almacenStockAlerta').innerText = '';
        }
    } catch (error) {
        console.error('Error cargando dashboard:', error);
    }
}