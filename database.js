// database.js - Base de datos local con autenticación y gestión de usuarios
// VERSIÓN SIN HASH - GARANTIZADA PARA FUNCIONAR

class LocalDatabase {
    constructor() {
        // Inicializar usuarios - Versión sin hash
        this.usuarios = this.cargarUsuarios();

        // Inicializar trabajadores desde localStorage o usar datos por defecto
        this.trabajadores = JSON.parse(localStorage.getItem('eyp_trabajadores')) || [
            { codigo: '9', nombre: 'Alvaro Hernandez' },
            { codigo: '32', nombre: 'Ariel David Arauz Ramirez' },
            { codigo: '408', nombre: 'Yobelky Alejandra Duarte Gonzalez' },
            { codigo: '443', nombre: 'Luis Adolfo Miranda Arias' },
            { codigo: '1295', nombre: 'Mayela De Jesus Benitez Diaz' }
        ];

        // Inicializar actividades desde localStorage o usar datos por defecto
        this.actividades = JSON.parse(localStorage.getItem('eyp_actividades')) || [
            { codigo: 'SUP1003', nombre: 'SUP' },
            { codigo: 'SIEF107', nombre: 'BOLIADORA' },
            { codigo: 'SIEF101', nombre: 'DESCARGA' }
        ];

        this.usuarioActual = null;
        this.init();
    }

    // Cargar usuarios - SIN HASH, usando texto plano para garantizar funcionamiento
    cargarUsuarios() {
        // Intentar cargar desde localStorage primero
        const usuariosGuardados = localStorage.getItem('eyp_usuarios');
        if (usuariosGuardados) {
            return JSON.parse(usuariosGuardados);
        }

        // Usuario y contraseña en TEXTO PLANO (para garantizar que funcione)
        const adminInicial = [
            {
                id: 1,
                username: 'Y.Oporta',
                password: 'Codex.2005', // ¡Texto plano para que funcione seguro!
                nombre: 'Yader Oporta',
                rol: 'administrador',
                activo: true,
                permisos: {
                    verAdminDB: true,
                    exportarExcel: true,
                    eliminarRegistros: true,
                    editarRegistros: true,
                    agregarRegistros: true,
                    gestionarUsuarios: true,
                    verHistorialGrupos: true,
                    verTodosLosGrupos: true,
                    cambiarPassword: true
                },
                preguntaSeguridad: '¿Cuál es tu color favorito?',
                respuestaSeguridad: 'azul' // Texto plano también
            }
        ];

        // Guardar en localStorage para futuros usos
        localStorage.setItem('eyp_usuarios', JSON.stringify(adminInicial));
        return adminInicial;
    }

    // Verificar contraseña - COMPARACIÓN DIRECTA
    verificarPassword(passwordIngresada, passwordAlmacenada) {
        // Comparación directa de strings
        console.log('Verificando contraseña:', {
            ingresada: passwordIngresada,
            almacenada: passwordAlmacenada,
            coinciden: passwordIngresada === passwordAlmacenada
        });
        return passwordIngresada === passwordAlmacenada;
    }

    init() {
        this.verificarSesion();
        // Mostrar credenciales en consola para depuración
        console.log('%c=== CREDENCIALES DE ACCESO ===', 'font-weight: bold; color: green;');
        console.log('%cUsuario: Y.Oporta', 'color: blue;');
        console.log('%cContraseña: Codex.2005', 'color: red;');
        console.log('%c==============================', 'font-weight: bold; color: green;');

        // Verificar que el usuario existe
        const admin = this.usuarios.find(u => u.username === 'Y.Oporta');
        if (admin) {
            console.log('✅ Usuario administrador encontrado en la base de datos');
        } else {
            console.log('❌ Usuario administrador NO encontrado - recreando...');
            localStorage.removeItem('eyp_usuarios');
            this.usuarios = this.cargarUsuarios();
        }
    }

    verificarSesion() {
        const sesion = localStorage.getItem('eyp_sesion');
        if (sesion) {
            try {
                this.usuarioActual = JSON.parse(sesion);
            } catch (e) {
                this.cerrarSesion();
            }
        }
    }

    // Login
    login(username, password) {
        console.log('Intentando login con:', { username, password });

        // Buscar usuario (case sensitive)
        const usuario = this.usuarios.find(u => u.username === username && u.activo);

        if (!usuario) {
            console.log('❌ Usuario no encontrado:', username);
            console.log('Usuarios disponibles:', this.usuarios.map(u => u.username));
            return { success: false, message: 'Usuario no encontrado' };
        }

        if (!this.verificarPassword(password, usuario.password)) {
            console.log('❌ Contraseña incorrecta para:', username);
            return { success: false, message: 'Contraseña incorrecta' };
        }

        this.usuarioActual = {
            id: usuario.id,
            username: usuario.username,
            nombre: usuario.nombre,
            rol: usuario.rol,
            permisos: usuario.permisos
        };

        localStorage.setItem('eyp_sesion', JSON.stringify(this.usuarioActual));
        console.log('✅ Login exitoso para:', username);
        return { success: true, message: 'Login exitoso', usuario: this.usuarioActual };
    }

    // Cerrar sesión
    cerrarSesion() {
        this.usuarioActual = null;
        localStorage.removeItem('eyp_sesion');
    }

    // Verificar si hay sesión activa
    haySesion() {
        return this.usuarioActual !== null;
    }

    // Obtener usuario actual
    getUsuarioActual() {
        return this.usuarioActual;
    }

    // Verificar si es administrador
    esAdministrador() {
        return this.usuarioActual && this.usuarioActual.rol === 'administrador';
    }

    // Verificar permiso específico
    tienePermiso(permiso) {
        if (!this.usuarioActual) return false;
        if (this.esAdministrador()) return true;
        return this.usuarioActual.permisos && this.usuarioActual.permisos[permiso] === true;
    }

    // Recuperar contraseña
    recuperarPassword(username, respuesta) {
        const usuario = this.usuarios.find(u => u.username === username);

        if (!usuario) {
            return { success: false, message: 'Usuario no encontrado' };
        }

        if (respuesta === usuario.respuestaSeguridad) {
            return {
                success: true,
                message: 'Respuesta correcta. Su contraseña es: ' + usuario.password
            };
        }

        return { success: false, message: 'Respuesta incorrecta' };
    }

    // Cambiar contraseña
    cambiarPassword(username, passwordActual, passwordNueva, esAdmin = false) {
        const usuario = this.usuarios.find(u => u.username === username);

        if (!usuario) {
            return { success: false, message: 'Usuario no encontrado' };
        }

        // Si no es admin, verificar contraseña actual
        if (!esAdmin) {
            if (passwordActual !== usuario.password) {
                return { success: false, message: 'Contraseña actual incorrecta' };
            }
        }

        usuario.password = passwordNueva;
        this.guardarUsuarios();
        return { success: true, message: 'Contraseña cambiada exitosamente' };
    }

    // CRUD de usuarios (solo administrador)
    getUsuarios() {
        if (!this.esAdministrador()) return [];
        return this.usuarios.map(u => ({
            ...u
            // Mostramos todo incluyendo contraseñas para el admin
        }));
    }

    agregarUsuario(usuarioData) {
        if (!this.esAdministrador()) {
            return { success: false, message: 'No autorizado' };
        }

        if (this.usuarios.some(u => u.username === usuarioData.username)) {
            return { success: false, message: 'El nombre de usuario ya existe' };
        }

        const nuevoUsuario = {
            id: this.usuarios.length + 1,
            username: usuarioData.username,
            password: usuarioData.password, // Texto plano
            nombre: usuarioData.nombre,
            rol: usuarioData.rol || 'usuario',
            activo: true,
            permisos: usuarioData.permisos || {
                verAdminDB: false,
                exportarExcel: false,
                eliminarRegistros: false,
                editarRegistros: true,
                agregarRegistros: true,
                gestionarUsuarios: false,
                verHistorialGrupos: true,
                verTodosLosGrupos: false,
                cambiarPassword: false
            },
            preguntaSeguridad: usuarioData.preguntaSeguridad,
            respuestaSeguridad: usuarioData.respuestaSeguridad // Texto plano
        };

        this.usuarios.push(nuevoUsuario);
        this.guardarUsuarios();
        return { success: true, message: 'Usuario agregado correctamente', usuario: nuevoUsuario };
    }

    editarUsuario(id, usuarioData) {
        if (!this.esAdministrador()) {
            return { success: false, message: 'No autorizado' };
        }

        const index = this.usuarios.findIndex(u => u.id === id);
        if (index === -1) {
            return { success: false, message: 'Usuario no encontrado' };
        }

        if (usuarioData.username && usuarioData.username !== this.usuarios[index].username) {
            if (this.usuarios.some(u => u.username === usuarioData.username)) {
                return { success: false, message: 'El nombre de usuario ya existe' };
            }
        }

        this.usuarios[index] = {
            ...this.usuarios[index],
            ...usuarioData
        };

        this.guardarUsuarios();
        return { success: true, message: 'Usuario actualizado correctamente' };
    }

    toggleUsuarioActivo(id) {
        if (!this.esAdministrador()) {
            return { success: false, message: 'No autorizado' };
        }

        const usuario = this.usuarios.find(u => u.id === id);
        if (!usuario) {
            return { success: false, message: 'Usuario no encontrado' };
        }

        usuario.activo = !usuario.activo;
        this.guardarUsuarios();
        return {
            success: true,
            message: `Usuario ${usuario.activo ? 'habilitado' : 'inhabilitado'} correctamente`
        };
    }

    eliminarUsuario(id) {
        if (!this.esAdministrador()) {
            return { success: false, message: 'No autorizado' };
        }

        if (id === 1) {
            return { success: false, message: 'No se puede eliminar al administrador principal' };
        }

        const index = this.usuarios.findIndex(u => u.id === id);
        if (index === -1) {
            return { success: false, message: 'Usuario no encontrado' };
        }

        this.usuarios.splice(index, 1);
        this.guardarUsuarios();
        return { success: true, message: 'Usuario eliminado correctamente' };
    }

    guardarUsuarios() {
        localStorage.setItem('eyp_usuarios', JSON.stringify(this.usuarios));
    }

    // CRUD de trabajadores
    getTrabajadores() {
        return this.trabajadores;
    }

    buscarTrabajador(codigo) {
        if (!codigo) return null;
        return this.trabajadores.find(t => t.codigo === codigo.trim());
    }

    buscarTrabajadoresPorNombreOMatch(termino) {
        if (!termino) return [];
        return this.trabajadores.filter(t =>
            t.codigo.includes(termino) ||
            t.nombre.toLowerCase().includes(termino.toLowerCase())
        ).slice(0, 5);
    }

    agregarTrabajador(codigo, nombre) {
        if (!this.tienePermiso('agregarRegistros') && !this.esAdministrador()) {
            return { success: false, message: 'No tiene permiso para agregar trabajadores' };
        }

        if (!codigo || !nombre) {
            return { success: false, message: 'Código y nombre son requeridos' };
        }

        if (this.trabajadores.some(t => t.codigo === codigo)) {
            return { success: false, message: 'Ya existe un trabajador con ese código' };
        }

        this.trabajadores.push({ codigo, nombre });
        this.guardarTrabajadores();
        return { success: true, message: 'Trabajador agregado correctamente' };
    }

    guardarTrabajadores() {
        localStorage.setItem('eyp_trabajadores', JSON.stringify(this.trabajadores));
    }

    // CRUD de actividades
    getActividades() {
        return this.actividades;
    }

    buscarActividad(codigo) {
        if (!codigo) return null;
        return this.actividades.find(a => a.codigo === codigo.trim());
    }

    buscarActividadesPorNombreOMatch(termino) {
        if (!termino) return [];
        return this.actividades.filter(a =>
            a.codigo.includes(termino) ||
            a.nombre.toLowerCase().includes(termino.toLowerCase())
        ).slice(0, 5);
    }

    agregarActividad(codigo, nombre) {
        if (!this.tienePermiso('agregarRegistros') && !this.esAdministrador()) {
            return { success: false, message: 'No tiene permiso para agregar actividades' };
        }

        if (!codigo || !nombre) {
            return { success: false, message: 'Código y actividad son requeridos' };
        }

        if (this.actividades.some(a => a.codigo === codigo)) {
            return { success: false, message: 'Ya existe una actividad con ese código' };
        }

        this.actividades.push({ codigo, nombre });
        this.guardarActividades();
        return { success: true, message: 'Actividad agregada correctamente' };
    }

    guardarActividades() {
        localStorage.setItem('eyp_actividades', JSON.stringify(this.actividades));
    }
}

// Inicializar la base de datos
const db = new LocalDatabase();