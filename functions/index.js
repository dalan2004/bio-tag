const crypto = require('node:crypto');
const { initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');

initializeApp();

const REGION = 'us-central1';
const DATABASE_ID = 'ai-studio-trazabilidaddeeq-01f737bf-d27b-4a9f-bc77-2398fa056371';
const BOOTSTRAP_CODE = defineSecret('BIO_TAG_BOOTSTRAP_CODE');
const db = getFirestore(undefined, DATABASE_ID);
const adminAuth = getAuth();

const callableOptions = {
  region: REGION,
  enforceAppCheck: true,
  consumeAppCheckToken: true,
  cors: true,
};

const ROLES = new Set(['ingeniero', 'admin_hospital', 'enfermeria', 'consulta']);

function asObject(value, label = 'datos') {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new HttpsError('invalid-argument', `${label} no tiene un formato válido.`);
  }
  return value;
}

function text(value, label, max = 200, required = true) {
  const normalized = typeof value === 'string' ? value.trim() : '';
  if (required && !normalized) {
    throw new HttpsError('invalid-argument', `${label} es obligatorio.`);
  }
  if (normalized.length > max) {
    throw new HttpsError('invalid-argument', `${label} supera ${max} caracteres.`);
  }
  return normalized;
}

function email(value) {
  const normalized = text(value, 'Correo', 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    throw new HttpsError('invalid-argument', 'El correo electrónico no es válido.');
  }
  return normalized;
}

function isoDate(value, label) {
  const normalized = text(value, label, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    throw new HttpsError('invalid-argument', `${label} debe usar el formato AAAA-MM-DD.`);
  }
  return normalized;
}

function documentId(value, label = 'Identificador', required = true) {
  const normalized = text(value, label, 128, required);
  if (normalized && !/^[A-Za-z0-9_-]+$/.test(normalized)) {
    throw new HttpsError('invalid-argument', `${label} contiene caracteres no permitidos.`);
  }
  return normalized;
}

function oneOf(value, label, allowed) {
  const normalized = text(value, label, 60);
  if (!allowed.includes(normalized)) {
    throw new HttpsError('invalid-argument', `${label} no es válido.`);
  }
  return normalized;
}

function booleanFields(value, label, fields) {
  const source = asObject(value, label);
  return Object.fromEntries(fields.map((field) => {
    if (typeof source[field] !== 'boolean') {
      throw new HttpsError('invalid-argument', `${label}.${field} debe ser booleano.`);
    }
    return [field, source[field]];
  }));
}

function nowIso() {
  return new Date().toISOString();
}

function randomTag() {
  return `bio_tag_${crypto.randomBytes(18).toString('hex')}`;
}

function randomPassword() {
  return `Bt!${crypto.randomBytes(24).toString('base64url')}9a#`;
}

function safeEqual(left, right) {
  const leftBuffer = Buffer.from(String(left));
  const rightBuffer = Buffer.from(String(right));
  return leftBuffer.length === rightBuffer.length &&
    crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function isStrongPassword(value) {
  return typeof value === 'string' && value.length >= 12 && value.length <= 128 &&
    /[a-z]/.test(value) && /[A-Z]/.test(value) && /[0-9]/.test(value) &&
    /[^A-Za-z0-9]/.test(value);
}

async function requireProfile(request, allowedRoles) {
  if (!request.auth?.uid) {
    throw new HttpsError('unauthenticated', 'Debes iniciar sesión.');
  }

  const snap = await db.doc(`users/${request.auth.uid}`).get();
  if (!snap.exists || snap.data().active !== true) {
    throw new HttpsError('permission-denied', 'La cuenta no tiene un perfil activo.');
  }

  const profile = snap.data();
  if (allowedRoles && !allowedRoles.includes(profile.role)) {
    throw new HttpsError('permission-denied', 'Tu rol no está autorizado para esta operación.');
  }
  return { uid: request.auth.uid, ...profile };
}

function auditRecord(profile, data) {
  return {
    ...data,
    id: data.id,
    institutionId: profile.institutionId,
    actorUid: profile.uid,
    changedBy: profile.fullName,
    changedByRh: profile.rh || '',
    timestamp: nowIso(),
  };
}

function sanitizeEquipmentInput(raw, institutionId) {
  const input = asObject(raw, 'Equipo');
  const allowedFields = [
    'id', 'codigoActivo', 'servicioUbicacion', 'nombre', 'marca', 'modelo',
    'serie', 'registroInvima', 'anioFabricacion', 'fotoUrl', 'tipoAdquisicion',
    'tipoMantenimiento', 'regimenMantenimiento', 'frecuenciaMantenimientoMeses',
    'documentacion', 'clasificacionBiomedica', 'clasificacionUso',
    'clasificacionRiesgo', 'movilidad', 'tecnologiaPredominante',
    'caracteristicasTecnicas', 'fuentesAlimentacion', 'accesorios',
    'observaciones', 'recomendacionesFabricante',
  ];
  const permitted = Object.fromEntries(
    allowedFields
      .filter((field) => Object.prototype.hasOwnProperty.call(input, field))
      .map((field) => [field, input[field]])
  );
  return {
    ...permitted,
    id: documentId(input.id, 'Identificador del equipo', false),
    institutionId,
    codigoActivo: text(input.codigoActivo, 'Código de activo', 80),
    servicioUbicacion: text(input.servicioUbicacion, 'Ubicación', 150),
    nombre: text(input.nombre, 'Nombre del equipo', 150),
    marca: text(input.marca, 'Marca', 100, false),
    modelo: text(input.modelo, 'Modelo', 100, false),
    serie: text(input.serie, 'Serie', 100),
    registroInvima: text(input.registroInvima, 'Registro INVIMA', 100, false),
    fotoUrl: text(input.fotoUrl, 'URL de fotografía', 2048, false),
    observaciones: text(input.observaciones, 'Observaciones', 2000, false),
    recomendacionesFabricante: text(
      input.recomendacionesFabricante,
      'Recomendaciones del fabricante',
      2000,
      false
    ),
  };
}

function publicEquipment(equipment) {
  const { lastUpdatedBy: _lastUpdatedBy, ...safeEquipment } = equipment;
  return safeEquipment;
}

function publicMaintenance(record) {
  if (!record) return null;
  const { createdBy: _createdBy, ...safeRecord } = record;
  return {
    ...safeRecord,
    trabajoRealizadoPor: 'Personal técnico autorizado',
    cargo: 'Ingeniería biomédica',
    rh: '',
    recibidoSatisfaccion: '',
    observacionesRepuestos: '',
  };
}

exports.getBootstrapStatus = onCall(callableOptions, async () => {
  const [snap, existingAdmins] = await Promise.all([
    db.doc('system/bootstrap').get(),
    db.collection('users').where('role', '==', 'admin_hospital').limit(1).get(),
  ]);
  return {
    configured: (snap.exists && snap.data().configured === true) || !existingAdmins.empty,
  };
});

exports.bootstrapAdmin = onCall(
  { ...callableOptions, secrets: [BOOTSTRAP_CODE] },
  async (request) => {
    const data = asObject(request.data);
    if (!safeEqual(data.bootstrapCode || '', BOOTSTRAP_CODE.value())) {
      throw new HttpsError('permission-denied', 'Código de configuración inicial inválido.');
    }

    const company = asObject(data.company, 'Empresa');
    const institution = asObject(data.institution, 'Institución');
    const admin = asObject(data.admin, 'Administrador');
    const adminEmail = email(admin.email);
    const password = text(admin.password, 'Contraseña', 128);
    if (!isStrongPassword(password)) {
      throw new HttpsError(
        'invalid-argument',
        'La contraseña debe tener 12 caracteres, mayúscula, minúscula, número y símbolo.'
      );
    }

    const bootstrapRef = db.doc('system/bootstrap');
    const [bootstrapSnap, existingAdmins] = await Promise.all([
      bootstrapRef.get(),
      db.collection('users').where('role', '==', 'admin_hospital').limit(1).get(),
    ]);
    if (bootstrapSnap.data()?.configured === true || !existingAdmins.empty) {
      throw new HttpsError('already-exists', 'La configuración inicial ya fue completada.');
    }

    let createdUser;
    try {
      createdUser = await adminAuth.createUser({
        email: adminEmail,
        password,
        displayName: text(admin.fullName, 'Nombre del administrador', 150),
        emailVerified: false,
        disabled: false,
      });

      const institutionRef = db.collection('institutions').doc();
      const institutionId = institutionRef.id;
      const createdAt = nowIso();
      const companyRecord = {
        id: 'main',
        nombre: text(company.nombre, 'Nombre de empresa', 200),
        nit: text(company.nit, 'NIT', 60),
        eslogan: text(company.eslogan, 'Eslogan', 200, false),
        logoUrl: '',
        direccion: text(company.direccion, 'Dirección', 200, false),
        ciudad: text(company.ciudad, 'Ciudad', 100, false),
        correo: company.correo ? email(company.correo) : '',
        telefonos: text(company.telefonos, 'Teléfonos', 80, false),
        colorPrincipal: text(company.colorPrincipal || '#0f2942', 'Color', 30),
        updatedAt: createdAt,
      };
      const institutionRecord = {
        id: institutionId,
        name: text(institution.name, 'Nombre de institución', 200),
        city: text(institution.city, 'Ciudad', 100),
        department: text(institution.department, 'Departamento', 100),
        address: text(institution.address, 'Dirección', 200, false),
        phone: text(institution.phone, 'Teléfono', 50, false),
        requireLoginForScan: true,
        nextConsecutive: Number.isInteger(institution.nextConsecutive) && institution.nextConsecutive > 0
          ? institution.nextConsecutive
          : 1,
        createdAt,
        updatedAt: createdAt,
      };
      const userRecord = {
        id: createdUser.uid,
        email: adminEmail,
        fullName: text(admin.fullName, 'Nombre del administrador', 150),
        role: 'admin_hospital',
        institutionId,
        cargo: text(admin.cargo || 'Administrador hospitalario', 'Cargo', 100),
        rh: text(admin.rh, 'Registro profesional', 60, false),
        active: true,
        createdAt,
        updatedAt: createdAt,
      };

      await db.runTransaction(async (tx) => {
        const current = await tx.get(bootstrapRef);
        if (current.exists && current.data().configured === true) {
          throw new HttpsError('already-exists', 'La configuración inicial ya fue completada.');
        }
        tx.set(db.doc('companies/main'), companyRecord);
        tx.set(institutionRef, institutionRecord);
        tx.set(db.doc(`users/${createdUser.uid}`), userRecord);
        tx.set(bootstrapRef, {
          configured: true,
          configuredAt: FieldValue.serverTimestamp(),
          administratorUid: createdUser.uid,
        });
      });

      await adminAuth.setCustomUserClaims(createdUser.uid, {
        role: 'admin_hospital',
        institutionId,
        active: true,
      });

      return { success: true, email: adminEmail };
    } catch (error) {
      if (createdUser?.uid) {
        await adminAuth.deleteUser(createdUser.uid).catch(() => undefined);
      }
      if (error instanceof HttpsError) throw error;
      throw new HttpsError('internal', 'No se pudo completar la configuración inicial.');
    }
  }
);

exports.createHospitalUser = onCall(callableOptions, async (request) => {
  const caller = await requireProfile(request, ['admin_hospital']);
  const data = asObject(request.data);
  const role = text(data.role, 'Rol', 30);
  if (!ROLES.has(role)) {
    throw new HttpsError('invalid-argument', 'Rol no permitido.');
  }
  const userEmail = email(data.email);
  let createdUser;

  try {
    createdUser = await adminAuth.createUser({
      email: userEmail,
      password: randomPassword(),
      displayName: text(data.fullName, 'Nombre', 150),
      emailVerified: false,
      disabled: false,
    });
    const record = {
      id: createdUser.uid,
      email: userEmail,
      fullName: text(data.fullName, 'Nombre', 150),
      role,
      institutionId: caller.institutionId,
      cargo: text(data.cargo || 'Personal hospitalario', 'Cargo', 100),
      rh: role === 'ingeniero' ? text(data.rh, 'Registro profesional', 60) : '',
      active: true,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    await db.doc(`users/${createdUser.uid}`).create(record);
    await adminAuth.setCustomUserClaims(createdUser.uid, {
      role,
      institutionId: caller.institutionId,
      active: true,
    });
    return { uid: createdUser.uid, email: userEmail };
  } catch (error) {
    if (createdUser?.uid) {
      await adminAuth.deleteUser(createdUser.uid).catch(() => undefined);
    }
    if (error?.code === 'auth/email-already-exists') {
      throw new HttpsError('already-exists', 'Ya existe una cuenta con ese correo.');
    }
    if (error instanceof HttpsError) throw error;
    throw new HttpsError('internal', 'No fue posible crear el usuario.');
  }
});

// Refresh trusted Storage/Auth claims from the active Firestore profile. This
// is also the migration path for users created before custom claims existed.
exports.syncMyClaims = onCall(callableOptions, async (request) => {
  const profile = await requireProfile(request);
  await adminAuth.setCustomUserClaims(profile.uid, {
    role: profile.role,
    institutionId: profile.institutionId,
    active: true,
  });
  return { success: true };
});

exports.setHospitalUserActive = onCall(callableOptions, async (request) => {
  const caller = await requireProfile(request, ['admin_hospital']);
  const data = asObject(request.data);
  const userId = documentId(data.userId, 'Usuario');
  const active = data.active;
  if (typeof active !== 'boolean') {
    throw new HttpsError('invalid-argument', 'El estado activo es inválido.');
  }
  if (userId === caller.uid) {
    throw new HttpsError('failed-precondition', 'No puedes desactivar tu propia cuenta.');
  }

  const targetRef = db.doc(`users/${userId}`);
  const targetSnap = await targetRef.get();
  if (!targetSnap.exists || targetSnap.data().institutionId !== caller.institutionId) {
    throw new HttpsError('not-found', 'Usuario no encontrado en tu institución.');
  }
  const target = targetSnap.data();

  await adminAuth.updateUser(userId, { disabled: !active });
  await adminAuth.setCustomUserClaims(userId, {
    role: target.role,
    institutionId: target.institutionId,
    active,
  });
  await targetRef.update({ active, updatedAt: nowIso() });
  await adminAuth.revokeRefreshTokens(userId);
  return { success: true };
});

exports.saveEquipment = onCall(callableOptions, async (request) => {
  const caller = await requireProfile(request, ['ingeniero']);
  const data = asObject(request.data);
  const incoming = sanitizeEquipmentInput(data.equipment, caller.institutionId);
  const requestedId = typeof incoming.id === 'string' ? incoming.id : '';
  const equipmentRef = requestedId
    ? db.doc(`equipments/${requestedId}`)
    : db.collection('equipments').doc();
  const auditRef = db.collection('audit_logs').doc();

  let saved;
  await db.runTransaction(async (tx) => {
    const existingSnap = await tx.get(equipmentRef);
    if (existingSnap.exists && existingSnap.data().institutionId !== caller.institutionId) {
      throw new HttpsError('permission-denied', 'El equipo pertenece a otra institución.');
    }
    const isNew = !existingSnap.exists;
    const existing = existingSnap.data() || {};
    saved = {
      ...incoming,
      id: equipmentRef.id,
      institutionId: caller.institutionId,
      tagToken: isNew ? randomTag() : existing.tagToken,
      tagActive: isNew ? true : existing.tagActive,
      fechaCreacion: isNew ? nowIso().slice(0, 10) : existing.fechaCreacion,
      updatedAt: nowIso(),
      lastUpdatedBy: `${caller.fullName} (${caller.rh || ''})`,
    };
    tx.set(equipmentRef, saved);
    tx.set(auditRef, auditRecord(caller, {
      id: auditRef.id,
      equipmentId: equipmentRef.id,
      entityType: 'equipment',
      action: isNew ? 'create' : 'update',
      summary: isNew
        ? `Creación del equipo ${saved.nombre} (${saved.codigoActivo}).`
        : `Actualización del equipo ${saved.nombre} (${saved.codigoActivo}).`,
    }));
  });
  return { equipment: saved };
});

exports.setEquipmentTagState = onCall(callableOptions, async (request) => {
  const caller = await requireProfile(request, ['ingeniero']);
  const data = asObject(request.data);
  const equipmentId = documentId(data.equipmentId, 'Equipo');
  const operation = text(data.operation, 'Operación', 20);
  if (!['rotate', 'deactivate'].includes(operation)) {
    throw new HttpsError('invalid-argument', 'Operación de etiqueta inválida.');
  }
  const equipmentRef = db.doc(`equipments/${equipmentId}`);
  const auditRef = db.collection('audit_logs').doc();
  let token = '';

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(equipmentRef);
    if (!snap.exists || snap.data().institutionId !== caller.institutionId) {
      throw new HttpsError('not-found', 'Equipo no encontrado.');
    }
    token = operation === 'rotate' ? randomTag() : snap.data().tagToken;
    tx.update(equipmentRef, {
      tagToken: token,
      tagActive: operation === 'rotate',
      updatedAt: nowIso(),
      lastUpdatedBy: `${caller.fullName} (${caller.rh || ''})`,
    });
    tx.set(auditRef, auditRecord(caller, {
      id: auditRef.id,
      equipmentId,
      entityType: 'tag',
      action: operation === 'rotate' ? 'new_tag' : 'deactivate_tag',
      summary: operation === 'rotate'
        ? 'Etiqueta NFC/QR rotada por un ingeniero autorizado.'
        : 'Etiqueta NFC/QR desactivada por un ingeniero autorizado.',
    }));
  });
  return { token, active: operation === 'rotate' };
});

exports.createMaintenance = onCall(callableOptions, async (request) => {
  const caller = await requireProfile(request, ['ingeniero']);
  const data = asObject(request.data);
  const input = asObject(data.record, 'Mantenimiento');
  const equipmentId = documentId(input.equipmentId, 'Equipo');
  const equipmentRef = db.doc(`equipments/${equipmentId}`);
  const institutionRef = db.doc(`institutions/${caller.institutionId}`);
  const maintenanceRef = db.collection('maintenances').doc();
  const auditRef = db.collection('audit_logs').doc();
  const initialInspection = asObject(input.inspeccionInicial, 'Inspección inicial');
  const protocolFields = [
    'p1_ubicacionDesconexion', 'p2_verificacionElectrico',
    'p3_verificacionElectronico', 'p4_verificacionNeumatico',
    'p5_verificacionMecanico', 'p6_verificacionHidraulico',
    'p7_lubricacionPartes', 'p8_limpiezaPistas',
    'p9_limpiezaElectrico', 'p10_montajeTarjetas', 'p11_pruebaInicial',
    'p12_limpiezaIntegral', 'p13_pruebaFinalOperador',
  ];
  const duration = input.duracionHoras === undefined ? null : Number(input.duracionHoras);
  if (duration !== null && (!Number.isFinite(duration) || duration < 0 || duration > 168)) {
    throw new HttpsError('invalid-argument', 'La duración del mantenimiento no es válida.');
  }
  let result;

  await db.runTransaction(async (tx) => {
    const [equipmentSnap, institutionSnap] = await Promise.all([
      tx.get(equipmentRef),
      tx.get(institutionRef),
    ]);
    if (!equipmentSnap.exists || equipmentSnap.data().institutionId !== caller.institutionId) {
      throw new HttpsError('not-found', 'Equipo no encontrado en tu institución.');
    }
    if (!institutionSnap.exists) {
      throw new HttpsError('failed-precondition', 'La institución no existe.');
    }
    const consecutive = institutionSnap.data().nextConsecutive || 1;
    const number = `No. ${String(consecutive).padStart(4, '0')}`;
    result = {
      id: maintenanceRef.id,
      institutionId: caller.institutionId,
      equipmentId,
      numeroReporte: number,
      consecutivo: consecutive,
      fecha: isoDate(input.fecha, 'Fecha'),
      cliente: text(input.cliente, 'Cliente', 150),
      ciudadDpto: text(input.ciudadDpto, 'Ciudad y departamento', 100),
      servicioUbicacion: text(input.servicioUbicacion, 'Ubicación', 150),
      tipoServicio: oneOf(input.tipoServicio, 'Tipo de servicio', [
        'preventivo', 'correctivo', 'garantia', 'capacitacion', 'otro',
      ]),
      tipoServicioOtro: text(input.tipoServicioOtro, 'Otro tipo de servicio', 120, false),
      inspeccionInicial: {
        estado: oneOf(initialInspection.estado, 'Estado físico', [
          'buen_estado', 'regular_estado', 'mal_estado', 'deterioro_fisico',
          'mal_funcionamiento', 'fuera_de_servicio',
        ]),
        accesorios: oneOf(initialInspection.accesorios, 'Estado de accesorios', [
          'buen_estado', 'regular_estado', 'mal_estado',
        ]),
      },
      protocolo: booleanFields(input.protocolo, 'Protocolo', protocolFields),
      observacionesRepuestos: text(input.observacionesRepuestos, 'Observaciones', 3000, false),
      trabajoRealizadoPor: caller.fullName,
      cargo: caller.cargo,
      rh: caller.rh || '',
      recibidoSatisfaccion: text(input.recibidoSatisfaccion, 'Recibido a satisfacción', 150),
      proximaFechaCalculada: isoDate(input.proximaFechaCalculada, 'Próxima fecha'),
      ...(duration === null ? {} : { duracionHoras: duration }),
      createdBy: caller.uid,
      createdAt: nowIso(),
    };
    tx.create(maintenanceRef, result);
    tx.update(institutionRef, {
      nextConsecutive: consecutive + 1,
      updatedAt: nowIso(),
    });
    tx.create(auditRef, auditRecord(caller, {
      id: auditRef.id,
      equipmentId,
      entityType: 'maintenance',
      action: 'create',
      summary: `Reporte ${number} radicado. Próximo mantenimiento: ${result.proximaFechaCalculada}.`,
    }));
  });
  return { maintenance: result };
});

exports.createIncident = onCall(callableOptions, async (request) => {
  const caller = await requireProfile(request, ['admin_hospital', 'ingeniero', 'enfermeria']);
  const data = asObject(request.data);
  const input = asObject(data.incident, 'Incidente');
  const equipmentId = documentId(input.equipmentId, 'Equipo');
  const equipmentSnap = await db.doc(`equipments/${equipmentId}`).get();
  if (!equipmentSnap.exists || equipmentSnap.data().institutionId !== caller.institutionId) {
    throw new HttpsError('not-found', 'Equipo no encontrado en tu institución.');
  }
  const priority = text(input.prioridad, 'Prioridad', 20);
  if (!['baja', 'media', 'alta', 'critica'].includes(priority)) {
    throw new HttpsError('invalid-argument', 'Prioridad inválida.');
  }
  const ref = db.collection('incidents').doc();
  const record = {
    id: ref.id,
    equipmentId,
    institutionId: caller.institutionId,
    fecha: nowIso().slice(0, 10),
    reportadoPor: caller.fullName,
    reportedByUid: caller.uid,
    cargo: caller.cargo,
    descripcion: text(input.descripcion, 'Descripción', 2000),
    prioridad: priority,
    estado: 'pendiente',
    createdAt: nowIso(),
  };
  await ref.create(record);
  return { incident: record };
});

exports.updateIncidentStatus = onCall(callableOptions, async (request) => {
  const caller = await requireProfile(request, ['admin_hospital', 'ingeniero']);
  const data = asObject(request.data);
  const incidentId = documentId(data.incidentId, 'Incidente');
  const status = text(data.status, 'Estado', 30);
  if (!['pendiente', 'en_revision', 'resuelto'].includes(status)) {
    throw new HttpsError('invalid-argument', 'Estado de incidente inválido.');
  }
  const ref = db.doc(`incidents/${incidentId}`);
  const snap = await ref.get();
  if (!snap.exists || snap.data().institutionId !== caller.institutionId) {
    throw new HttpsError('not-found', 'Incidente no encontrado.');
  }
  await ref.update({
    estado: status,
    statusUpdatedAt: nowIso(),
    statusUpdatedBy: caller.uid,
  });
  return { success: true };
});

exports.getPublicEquipmentByToken = onCall(callableOptions, async (request) => {
  const token = text(asObject(request.data).token, 'Token', 128);
  if (!/^bio_tag_[a-f0-9]{24,64}$/i.test(token)) {
    return { found: false };
  }

  const equipmentQuery = await db.collection('equipments')
    .where('tagToken', '==', token)
    .limit(1)
    .get();
  if (equipmentQuery.empty || equipmentQuery.docs[0].data().tagActive !== true) {
    return { found: false };
  }

  const equipment = equipmentQuery.docs[0].data();
  const institutionSnap = await db.doc(`institutions/${equipment.institutionId}`).get();
  if (!institutionSnap.exists) return { found: false };
  const institution = institutionSnap.data();

  if (institution.requireLoginForScan === true) {
    if (!request.auth?.uid) {
      return {
        found: true,
        requiresLogin: true,
        institution: { id: institution.id, name: institution.name, city: institution.city },
      };
    }
    const viewer = await requireProfile(request);
    if (viewer.institutionId !== equipment.institutionId) {
      throw new HttpsError('permission-denied', 'El equipo pertenece a otra institución.');
    }
  }

  const maintenanceQuery = await db.collection('maintenances')
    .where('equipmentId', '==', equipment.id)
    .get();
  const maintenance = maintenanceQuery.docs
    .map((doc) => doc.data())
    .sort((a, b) => String(b.fecha).localeCompare(String(a.fecha)))[0] || null;

  return {
    found: true,
    requiresLogin: false,
    institution: {
      id: institution.id,
      name: institution.name,
      city: institution.city,
      department: institution.department,
      address: institution.address,
      phone: institution.phone,
      requireLoginForScan: institution.requireLoginForScan,
      nextConsecutive: 0,
    },
    equipment: publicEquipment(equipment),
    latestMaintenance: publicMaintenance(maintenance),
  };
});
