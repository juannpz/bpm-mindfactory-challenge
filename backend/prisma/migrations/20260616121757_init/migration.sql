-- CreateTable
CREATE TABLE "Area" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Area_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UsuarioInterno" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "areaId" TEXT,
    "rol" TEXT NOT NULL,
    "azureObjectId" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "UsuarioInterno_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UsuarioExterno" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "documento" TEXT NOT NULL,
    "organizacion" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'PENDIENTE_VERIFICACION',
    "fechaAlta" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UsuarioExterno_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TipoTramite" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "requiereExterno" BOOLEAN NOT NULL DEFAULT false,
    "permiteInicioExterno" BOOLEAN NOT NULL DEFAULT false,
    "slaHoras" INTEGER NOT NULL,
    "areaInicialId" TEXT,

    CONSTRAINT "TipoTramite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tramite" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "tipoTramiteId" TEXT,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL DEFAULT '',
    "origen" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'BORRADOR',
    "prioridad" TEXT NOT NULL DEFAULT 'MEDIA',
    "areaActualId" TEXT,
    "usuarioAsignadoId" TEXT,
    "usuarioExternoId" TEXT,
    "creadoPorTipo" TEXT NOT NULL,
    "creadoPorInternoId" TEXT,
    "creadoPorExternoId" TEXT,
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaActualizacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaCierre" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "Tramite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MovimientoTramite" (
    "id" TEXT NOT NULL,
    "tramiteId" TEXT,
    "estadoAnterior" TEXT,
    "estadoNuevo" TEXT NOT NULL,
    "areaAnteriorId" TEXT,
    "areaNuevaId" TEXT,
    "usuarioTipo" TEXT NOT NULL,
    "usuarioId" TEXT,
    "accion" TEXT NOT NULL,
    "comentario" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MovimientoTramite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentoTramite" (
    "id" TEXT NOT NULL,
    "tramiteId" TEXT,
    "nombreArchivo" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "storageKey" TEXT NOT NULL,
    "subidoPorTipo" TEXT NOT NULL,
    "subidoPorId" TEXT,
    "fechaCarga" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentoTramite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComentarioTramite" (
    "id" TEXT NOT NULL,
    "tramiteId" TEXT,
    "mensaje" TEXT NOT NULL,
    "visibilidad" TEXT NOT NULL DEFAULT 'TODOS',
    "autorTipo" TEXT NOT NULL,
    "autorId" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ComentarioTramite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Area_codigo_key" ON "Area"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "UsuarioInterno_email_key" ON "UsuarioInterno"("email");

-- CreateIndex
CREATE UNIQUE INDEX "UsuarioInterno_azureObjectId_key" ON "UsuarioInterno"("azureObjectId");

-- CreateIndex
CREATE UNIQUE INDEX "UsuarioExterno_email_key" ON "UsuarioExterno"("email");

-- CreateIndex
CREATE UNIQUE INDEX "TipoTramite_codigo_key" ON "TipoTramite"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "Tramite_numero_key" ON "Tramite"("numero");

-- CreateIndex
CREATE INDEX "Tramite_estado_idx" ON "Tramite"("estado");

-- CreateIndex
CREATE INDEX "Tramite_origen_idx" ON "Tramite"("origen");

-- CreateIndex
CREATE INDEX "Tramite_areaActualId_idx" ON "Tramite"("areaActualId");

-- CreateIndex
CREATE INDEX "Tramite_usuarioAsignadoId_idx" ON "Tramite"("usuarioAsignadoId");

-- CreateIndex
CREATE INDEX "Tramite_usuarioExternoId_idx" ON "Tramite"("usuarioExternoId");

-- CreateIndex
CREATE INDEX "Tramite_fechaCreacion_idx" ON "Tramite"("fechaCreacion");

-- CreateIndex
CREATE INDEX "MovimientoTramite_tramiteId_idx" ON "MovimientoTramite"("tramiteId");

-- CreateIndex
CREATE INDEX "MovimientoTramite_fecha_idx" ON "MovimientoTramite"("fecha");

-- CreateIndex
CREATE INDEX "DocumentoTramite_tramiteId_idx" ON "DocumentoTramite"("tramiteId");

-- CreateIndex
CREATE INDEX "ComentarioTramite_tramiteId_idx" ON "ComentarioTramite"("tramiteId");

-- CreateIndex
CREATE INDEX "ComentarioTramite_visibilidad_idx" ON "ComentarioTramite"("visibilidad");

-- AddForeignKey
ALTER TABLE "UsuarioInterno" ADD CONSTRAINT "UsuarioInterno_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "Area"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TipoTramite" ADD CONSTRAINT "TipoTramite_areaInicialId_fkey" FOREIGN KEY ("areaInicialId") REFERENCES "Area"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tramite" ADD CONSTRAINT "Tramite_tipoTramiteId_fkey" FOREIGN KEY ("tipoTramiteId") REFERENCES "TipoTramite"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tramite" ADD CONSTRAINT "Tramite_areaActualId_fkey" FOREIGN KEY ("areaActualId") REFERENCES "Area"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tramite" ADD CONSTRAINT "Tramite_usuarioAsignadoId_fkey" FOREIGN KEY ("usuarioAsignadoId") REFERENCES "UsuarioInterno"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tramite" ADD CONSTRAINT "Tramite_usuarioExternoId_fkey" FOREIGN KEY ("usuarioExternoId") REFERENCES "UsuarioExterno"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tramite" ADD CONSTRAINT "Tramite_creadoPorInternoId_fkey" FOREIGN KEY ("creadoPorInternoId") REFERENCES "UsuarioInterno"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tramite" ADD CONSTRAINT "Tramite_creadoPorExternoId_fkey" FOREIGN KEY ("creadoPorExternoId") REFERENCES "UsuarioExterno"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimientoTramite" ADD CONSTRAINT "MovimientoTramite_tramiteId_fkey" FOREIGN KEY ("tramiteId") REFERENCES "Tramite"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentoTramite" ADD CONSTRAINT "DocumentoTramite_tramiteId_fkey" FOREIGN KEY ("tramiteId") REFERENCES "Tramite"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComentarioTramite" ADD CONSTRAINT "ComentarioTramite_tramiteId_fkey" FOREIGN KEY ("tramiteId") REFERENCES "Tramite"("id") ON DELETE SET NULL ON UPDATE CASCADE;
