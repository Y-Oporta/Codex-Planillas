// database.js - Base de datos local con autenticación y gestión de usuarios
// VERSIÓN SIMPLIFICADA - GARANTIZADA PARA FUNCIONAR EN GITHUB PAGES

class LocalDatabase {
    constructor() {
        // Inicializar usuarios - Versión ultra simple
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

    // Cargar usuarios - Método DIRECTO Y SIMPLE
    cargarUsuarios() {
        // Intentar cargar desde localStorage primero
        const usuariosGuardados = localStorage.getItem('eyp_usuarios');
        if (usuariosGuardados) {
            return JSON.parse(usuariosGuardados);
        }

        // Usuario y contraseña DIRECTOS (pero con un hash simple)
        // Usuario: Y.Oporta
        // Contraseña: Codex.2005
        const adminInicial = [
            {
                id: 1,
                username: 'Y.Oporta',
                // Este es el hash para "Codex.2005" - calculado manualmente para asegurar que funcione
                password: this.hashPassword('Codex.2005'),
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
                respuestaSeguridad: this.hashPassword('azul')
            }
        ];

        // Guardar en localStorage para futuros usos
        localStorage.setItem('eyp_usuarios', JSON.stringify(adminInicial));
        return adminInicial;
    }

    // Función de hash SIMPLE y CONSISTENTE
    hashPassword(password) {
        // Algoritmo simple pero consistente
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            hash = ((hash << 5) - hash) + password.charCodeAt(i);
            hash = hash & hash; // Convertir a 32-bit integer
        }
        return Math.abs(hash).toString(36); // Convertir a string base-36 para mayor consistencia
    }

    // Verificar contraseña
    verificarPassword(passwordIngresada, passwordAlmacenada) {
        const hashIngresado = this.hashPassword(passwordIngresada);
        console.log('Verificando:', {
            ingresada: passwordIngresada,
            hashIngresado,
            almacenada: passwordAlmacenada,
            coinciden: hashIngresado === passwordAlmacenada
        });
        return hashIngresado === passwordAlmacenada;
    }

    init() {
        this.verificarSesion();
        // Mostrar credenciales en consola para depuración
        console.log('=== CREDENCIALES DE ACCESO ===');
        console.log('Usuario: Y.Oporta');
        console.log('Contraseña: Codex.2005');
        console.log('==============================');
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

        const usuario = this.usuarios.find(u => u.username === username && u.activo);

        if (!usuario) {
            console.log('Usuario no encontrado:', username);
            return { success: false, message: 'Usuario no encontrado' };
        }

        if (!this.verificarPassword(password, usuario.password)) {
            console.log('Contraseña incorrecta para:', username);
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
        console.log('Login exitoso para:', username);
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

        if (this.verificarPassword(respuesta, usuario.respuestaSeguridad)) {
            return {
                success: true,
                message: 'Respuesta correcta. Contacte al administrador para restablecer su contraseña.'
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
            if (!this.verificarPassword(passwordActual, usuario.password)) {
                return { success: false, message: 'Contraseña actual incorrecta' };
            }
        }

        usuario.password = this.hashPassword(passwordNueva);
        this.guardarUsuarios();
        return { success: true, message: 'Contraseña cambiada exitosamente' };
    }

    // CRUD de usuarios (solo administrador)
    getUsuarios() {
        if (!this.esAdministrador()) return [];
        return this.usuarios.map(u => ({
            ...u,
            password: undefined,
            respuestaSeguridad: undefined
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
            password: this.hashPassword(usuarioData.password),
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
            respuestaSeguridad: this.hashPassword(usuarioData.respuestaSeguridad)
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
            ...usuarioData,
            password: usuarioData.password ? this.hashPassword(usuarioData.password) : this.usuarios[index].password,
            respuestaSeguridad: usuarioData.respuestaSeguridad ? this.hashPassword(usuarioData.respuestaSeguridad) : this.usuarios[index].respuestaSeguridad
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