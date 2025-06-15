# Configuración de Políticas RLS en Supabase para AIDUXCARE-V.2

Este documento describe cómo configurar políticas de seguridad a nivel de fila (Row Level Security - RLS) en la tabla `patients` en Supabase, para asegurar que cada profesional de salud solo tenga acceso a sus propios pacientes.

## 1. Habilitar RLS en la tabla "patients"

1. Inicia sesión en el panel de administración de Supabase
2. Ve a la sección **Database** → **Tables**
3. Selecciona la tabla `patients`
4. Activa la opción **Enable RLS**

## 2. Crear políticas para la tabla "patients"

### 2.1 Política para lectura (SELECT)

Esta política permite a los usuarios leer solo los pacientes que han creado:

```sql
CREATE POLICY "Profesionales pueden ver sus propios pacientes" 
ON "public"."patients"
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);
```

### 2.2 Política para inserción (INSERT)

Esta política permite a los usuarios autenticados crear pacientes, ya que el campo `user_id` se establece automáticamente en el código:

```sql
CREATE POLICY "Profesionales pueden crear pacientes" 
ON "public"."patients"
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);
```

### 2.3 Política para actualización (UPDATE)

Esta política permite a los usuarios modificar solo los pacientes que han creado:

```sql
CREATE POLICY "Profesionales pueden actualizar sus propios pacientes" 
ON "public"."patients"
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id);
```

### 2.4 Política para eliminación (DELETE)

Esta política permite a los usuarios eliminar solo los pacientes que han creado:

```sql
CREATE POLICY "Profesionales pueden eliminar sus propios pacientes" 
ON "public"."patients"
FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);
```

## 3. Política especial para administradores (opcional)

Si necesitas que los administradores accedan a todos los pacientes, puedes crear políticas adicionales:

```sql
CREATE POLICY "Administradores pueden ver todos los pacientes"
ON "public"."patients"
FOR ALL
TO authenticated
USING (EXISTS (
  SELECT 1 FROM user_profiles
  WHERE user_profiles.id = auth.uid()
  AND user_profiles.role = 'admin'
));
```

## 4. Verificación

Para verificar que las políticas funcionan correctamente:

1. Inicia sesión como un profesional de salud
2. Crea un nuevo paciente
3. Verifica que el paciente aparezca en la lista de pacientes
4. Cierra sesión e inicia sesión como otro profesional
5. Verifica que el paciente creado anteriormente no aparezca en la lista

## Notas importantes

- El campo `user_id` en la tabla `patients` se utiliza para almacenar el ID del profesional de salud responsable del paciente, no del usuario paciente.
- La aplicación ya ha sido modificada para asignar automáticamente el `auth.uid()` al campo `user_id` al crear pacientes.
- Las consultas a la tabla `patients` ahora están filtradas automáticamente por Supabase según las políticas RLS. 