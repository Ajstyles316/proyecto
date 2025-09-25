import PropTypes from 'prop-types';
import { formatDateOnly } from './helpers';

const MantenimientoSection = ({ maquinaria, mantenimientos }) => {
  return `

    <!-- Título Principal -->
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="font-size: 16px; margin-bottom: 16px; color: #333;">CÓDIGO: ${maquinaria?.codigo || 'N/A'}</div>
    </div>

    <!-- Datos del Vehículo/Maquinaria -->
    <div style="margin-bottom: 24px;">
      <div style="font-size: 16px; font-weight: bold; margin-bottom: 16px; background-color: #e4ecfeff; color: black; padding: 8px; border-radius: 4px;">DATOS VEHICULO, MAQUINARIA, EQUIPO</div>
      
      <div style="display: flex; gap: 16px;">
        <!-- Columna Izquierda - Imagen y Datos Generales -->
        <div style="flex: 1;">
          <div style="display: flex; gap: 16px;">
            <!-- Imagen -->
            <div style="flex: 1;">
              ${maquinaria?.imagen ? `<img src="${maquinaria.imagen}" alt="Imagen de ${maquinaria?.detalle || 'maquinaria'}" style="width: 100%; height: 200px; object-fit: cover; border-radius: 8px; border: 2px solid #e0e0e0;" />` : ''}
            </div>
            
            <!-- Datos Generales -->
            <div style="flex: 1;">
              <div style="font-size: 14px; font-weight: bold; margin-bottom: 16px; background-color: #f5f5f5; padding: 8px;">DATOS GENERALES</div>
              <table style="border: 1px solid #ddd; width: 100%; border-collapse: collapse;">
                <tbody>
                  ${maquinaria?.detalle ? `<tr><td style="font-weight: bold; width: 40%; padding: 4px; border: 1px solid #ddd;">Equipo:</td><td style="padding: 4px; border: 1px solid #ddd;">${maquinaria.detalle}</td></tr>` : ''}
                  ${maquinaria?.placa ? `<tr><td style="font-weight: bold; padding: 4px; border: 1px solid #ddd;">Placa:</td><td style="padding: 4px; border: 1px solid #ddd;">${maquinaria.placa}</td></tr>` : ''}
                  ${maquinaria?.marca ? `<tr><td style="font-weight: bold; padding: 4px; border: 1px solid #ddd;">Marca:</td><td style="padding: 4px; border: 1px solid #ddd;">${maquinaria.marca}</td></tr>` : ''}
                  ${maquinaria?.modelo ? `<tr><td style="font-weight: bold; padding: 4px; border: 1px solid #ddd;">Modelo:</td><td style="padding: 4px; border: 1px solid #ddd;">${maquinaria.modelo}</td></tr>` : ''}
                  ${maquinaria?.nro_chasis ? `<tr><td style="font-weight: bold; padding: 4px; border: 1px solid #ddd;">Chasis:</td><td style="padding: 4px; border: 1px solid #ddd;">${maquinaria.nro_chasis}</td></tr>` : ''}
                  ${maquinaria?.tipo ? `<tr><td style="font-weight: bold; padding: 4px; border: 1px solid #ddd;">Tipo:</td><td style="padding: 4px; border: 1px solid #ddd;">${maquinaria.tipo}</td></tr>` : ''}
                  ${maquinaria?.color ? `<tr><td style="font-weight: bold; padding: 4px; border: 1px solid #ddd;">Color:</td><td style="padding: 4px; border: 1px solid #ddd;">${maquinaria.color}</td></tr>` : ''}
                  ${maquinaria?.tipo_vehiculo ? `<tr><td style="font-weight: bold; padding: 4px; border: 1px solid #ddd;">Tracción:</td><td style="padding: 4px; border: 1px solid #ddd;">${maquinaria.tipo_vehiculo}</td></tr>` : ''}
                  ${maquinaria?.nro_motor ? `<tr><td style="font-weight: bold; padding: 4px; border: 1px solid #ddd;">No. del Motor:</td><td style="padding: 4px; border: 1px solid #ddd;">${maquinaria.nro_motor}</td></tr>` : ''}
                  <tr><td style="font-weight: bold; padding: 4px; border: 1px solid #ddd;">Estado:</td><td style="padding: 4px; border: 1px solid #ddd;">OPERABLE</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Columna Derecha - Datos Técnicos -->
        <div style="flex: 1;">
          <!-- Tipo de Desplazamiento -->
          <div style="font-size: 12px; font-weight: bold; margin-bottom: 8px;">TIPO DE DESPLAZAMIENTO</div>
          <table style="border: 1px solid #ddd; width: 100%; border-collapse: collapse; margin-bottom: 16px;">
            <thead>
              <tr style="background-color: #f0f0f0;">
                <td style="font-weight: bold; font-size: 10px; padding: 4px; border: 1px solid #ddd;">CANTIDAD</td>
                <td style="font-weight: bold; font-size: 10px; padding: 4px; border: 1px solid #ddd;">NUMERO DE LLANTA</td>
                <td style="font-weight: bold; font-size: 10px; padding: 4px; border: 1px solid #ddd;">NUMERO DE LLANTA DELANTERA</td>
                <td style="font-weight: bold; font-size: 10px; padding: 4px; border: 1px solid #ddd;">VIDA UTIL</td>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="font-size: 10px; padding: 4px; border: 1px solid #ddd;">${mantenimientos[0]?.tipo_desplazamiento_cantidad || '10'}</td>
                <td style="font-size: 10px; padding: 4px; border: 1px solid #ddd;">${mantenimientos[0]?.tipo_desplazamiento_numero_llanta || '11R22,5'}</td>
                <td style="font-size: 10px; padding: 4px; border: 1px solid #ddd;">${mantenimientos[0]?.tipo_desplazamiento_numero_llanta_delantera || '11R22,5'}</td>
                <td style="font-size: 10px; padding: 4px; border: 1px solid #ddd;">${mantenimientos[0]?.tipo_desplazamiento_vida_util || '3'}</td>
              </tr>
            </tbody>
          </table>

          <!-- Sistema Eléctrico -->
          <div style="font-size: 12px; font-weight: bold; margin-bottom: 8px;">SISTEMA ELÉCTRICO</div>
          <table style="border: 1px solid #ddd; width: 100%; border-collapse: collapse; margin-bottom: 16px;">
            <thead>
              <tr style="background-color: #f0f0f0;">
                <td style="font-weight: bold; font-size: 10px; padding: 4px; border: 1px solid #ddd;">CANTIDAD</td>
                <td style="font-weight: bold; font-size: 10px; padding: 4px; border: 1px solid #ddd;">VOLTAJE</td>
                <td style="font-weight: bold; font-size: 10px; padding: 4px; border: 1px solid #ddd;">AMPERAJE</td>
                <td style="font-weight: bold; font-size: 10px; padding: 4px; border: 1px solid #ddd;">VIDA UTIL</td>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="font-size: 10px; padding: 4px; border: 1px solid #ddd;">${mantenimientos[0]?.cantidad_sistema_electrico || '3'}</td>
                <td style="font-size: 10px; padding: 4px; border: 1px solid #ddd;">${mantenimientos[0]?.voltaje_sistema_electrico || '12'}</td>
                <td style="font-size: 10px; padding: 4px; border: 1px solid #ddd;">${mantenimientos[0]?.amperaje_sistema_electrico || '100'}</td>
                <td style="font-size: 10px; padding: 4px; border: 1px solid #ddd;">${mantenimientos[0]?.vida_util_sistema_electrico || 'AÑOS'}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Aceites y Fluidos -->
    <div style="margin-bottom: 24px;">
      <div style="font-size: 16px; font-weight: bold; margin-bottom: 16px; background-color: #f5f5f5; color: black; padding: 8px; border-radius: 4px;">ACEITES Y FLUIDOS</div>
      
      <div style="display: flex; gap: 16px;">
        <div style="flex: 1;">
          <!-- Aceite de Motor -->
          <div style="font-size: 12px; font-weight: bold; margin-bottom: 8px;">ACEITE DE MOTOR</div>
          <table style="border: 1px solid #ddd; width: 100%; border-collapse: collapse; margin-bottom: 16px;">
            <thead>
              <tr style="background-color: #f0f0f0;">
                <td style="font-weight: bold; font-size: 10px; padding: 4px; border: 1px solid #ddd;">CANTIDAD</td>
                <td style="font-weight: bold; font-size: 10px; padding: 4px; border: 1px solid #ddd;">NUMERO</td>
                <td style="font-weight: bold; font-size: 10px; padding: 4px; border: 1px solid #ddd;">CAMBIO (HR/KM)</td>
                <td style="font-weight: bold; font-size: 10px; padding: 4px; border: 1px solid #ddd;">NUMERO DE FILTRO</td>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="font-size: 10px; padding: 4px; border: 1px solid #ddd;">${mantenimientos[0]?.aceite_motor_cantidad || '45 LT'}</td>
                <td style="font-size: 10px; padding: 4px; border: 1px solid #ddd;">${mantenimientos[0]?.aceite_motor_numero || '15W40'}</td>
                <td style="font-size: 10px; padding: 4px; border: 1px solid #ddd;">${mantenimientos[0]?.aceite_motor_cambio_km_hr || '5000 KM'}</td>
                <td style="font-size: 10px; padding: 4px; border: 1px solid #ddd;">${mantenimientos[0]?.aceite_motor_numero_filtro || 'P559000'}</td>
              </tr>
            </tbody>
          </table>

          <!-- Aceite Hidráulico -->
          <div style="font-size: 12px; font-weight: bold; margin-bottom: 8px;">ACEITE DE HIDRAULICO</div>
          <table style="border: 1px solid #ddd; width: 100%; border-collapse: collapse; margin-bottom: 16px;">
            <thead>
              <tr style="background-color: #f0f0f0;">
                <td style="font-weight: bold; font-size: 10px; padding: 4px; border: 1px solid #ddd;">CANTIDAD</td>
                <td style="font-weight: bold; font-size: 10px; padding: 4px; border: 1px solid #ddd;">NUMERO</td>
                <td style="font-weight: bold; font-size: 10px; padding: 4px; border: 1px solid #ddd;">CAMBIO (HR/KM)</td>
                <td style="font-weight: bold; font-size: 10px; padding: 4px; border: 1px solid #ddd;">NUMERO DE FILTRO</td>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="font-size: 10px; padding: 4px; border: 1px solid #ddd;">${mantenimientos[0]?.aceite_hidraulico_cantidad || '100'}</td>
                <td style="font-size: 10px; padding: 4px; border: 1px solid #ddd;">${mantenimientos[0]?.aceite_hidraulico_numero || 'ISO VG68'}</td>
                <td style="font-size: 10px; padding: 4px; border: 1px solid #ddd;">${mantenimientos[0]?.aceite_hidraulico_cambio_km_hr || '4000 H'}</td>
                <td style="font-size: 10px; padding: 4px; border: 1px solid #ddd;">${mantenimientos[0]?.aceite_hidraulico_numero_filtro || 'P550388'}</td>
              </tr>
            </tbody>
          </table>

          <!-- Aceite de Transmisión -->
          <div style="font-size: 12px; font-weight: bold; margin-bottom: 8px;">ACEITE DE TRANSMISION</div>
          <table style="border: 1px solid #ddd; width: 100%; border-collapse: collapse; margin-bottom: 16px;">
            <thead>
              <tr style="background-color: #f0f0f0;">
                <td style="font-weight: bold; font-size: 10px; padding: 4px; border: 1px solid #ddd;">CANTIDAD</td>
                <td style="font-weight: bold; font-size: 10px; padding: 4px; border: 1px solid #ddd;">NUMERO</td>
                <td style="font-weight: bold; font-size: 10px; padding: 4px; border: 1px solid #ddd;">CAMBIO (HR/KM)</td>
                <td style="font-weight: bold; font-size: 10px; padding: 4px; border: 1px solid #ddd;">NUMERO DE FILTRO</td>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="font-size: 10px; padding: 4px; border: 1px solid #ddd;">${mantenimientos[0]?.aceite_transmision_cantidad || '6LTS'}</td>
                <td style="font-size: 10px; padding: 4px; border: 1px solid #ddd;">${mantenimientos[0]?.aceite_transmision_numero || '-'}</td>
                <td style="font-size: 10px; padding: 4px; border: 1px solid #ddd;">${mantenimientos[0]?.aceite_transmision_cambio_km_hr || '20.000 KM'}</td>
                <td style="font-size: 10px; padding: 4px; border: 1px solid #ddd;">${mantenimientos[0]?.aceite_transmision_numero_filtro || '-'}</td>
              </tr>
            </tbody>
          </table>

          <!-- Líquido de Freno -->
          <div style="font-size: 12px; font-weight: bold; margin-bottom: 8px;">LIQUIDO DE FRENO</div>
          <table style="border: 1px solid #ddd; width: 100%; border-collapse: collapse; margin-bottom: 16px;">
            <thead>
              <tr style="background-color: #f0f0f0;">
                <td style="font-weight: bold; font-size: 10px; padding: 4px; border: 1px solid #ddd;">CANTIDAD</td>
                <td style="font-weight: bold; font-size: 10px; padding: 4px; border: 1px solid #ddd;">NUMERO</td>
                <td style="font-weight: bold; font-size: 10px; padding: 4px; border: 1px solid #ddd;">CAMBIO (HR/KM)</td>
                <td style="font-weight: bold; font-size: 10px; padding: 4px; border: 1px solid #ddd;">NUMERO DE FILTRO COMB.</td>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="font-size: 10px; padding: 4px; border: 1px solid #ddd;">${mantenimientos[0]?.liquido_freno_cantidad || '20'}</td>
                <td style="font-size: 10px; padding: 4px; border: 1px solid #ddd;">${mantenimientos[0]?.liquido_freno_numero || '80W90'}</td>
                <td style="font-size: 10px; padding: 4px; border: 1px solid #ddd;">${mantenimientos[0]?.liquido_freno_cambio_km_hr || '40000 KM'}</td>
                <td style="font-size: 10px; padding: 4px; border: 1px solid #ddd;">${mantenimientos[0]?.liquido_freno_numero_filtro_combustible || '-'}</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div style="flex: 1;">
          <!-- Líquido Refrigerante -->
          <div style="font-size: 12px; font-weight: bold; margin-bottom: 8px;">LIQUIDO REFRIGERANTE</div>
          <table style="border: 1px solid #ddd; width: 100%; border-collapse: collapse; margin-bottom: 16px;">
            <thead>
              <tr style="background-color: #f0f0f0;">
                <td style="font-weight: bold; font-size: 10px; padding: 4px; border: 1px solid #ddd;">TIPO DE REFRIGERANTE</td>
                <td style="font-weight: bold; font-size: 10px; padding: 4px; border: 1px solid #ddd;">CANTIDAD REFRIGERANTE (Lt)</td>
                <td style="font-weight: bold; font-size: 10px; padding: 4px; border: 1px solid #ddd;">FRECUENCIA DE CAMBIO (HR/KM)</td>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="font-size: 10px; padding: 4px; border: 1px solid #ddd;">${mantenimientos[0]?.liquido_refrigerante_tipo || '-'}</td>
                <td style="font-size: 10px; padding: 4px; border: 1px solid #ddd;">${mantenimientos[0]?.liquido_refrigerante_cantidad_lt || '-'}</td>
                <td style="font-size: 10px; padding: 4px; border: 1px solid #ddd;">${mantenimientos[0]?.liquido_refrigerante_frecuencia_cambio || '-'}</td>
              </tr>
            </tbody>
          </table>
          
          <!-- Otros Aceites -->
          <div style="font-size: 12px; font-weight: bold; margin-bottom: 8px;">OTROS ACEITES</div>
          <table style="border: 1px solid #ddd; width: 100%; border-collapse: collapse; margin-bottom: 16px;">
            <thead>
              <tr style="background-color: #f0f0f0;">
                <td style="font-weight: bold; font-size: 10px; padding: 4px; border: 1px solid #ddd;">TIPO DE REFRIGERANTE</td>
                <td style="font-weight: bold; font-size: 10px; padding: 4px; border: 1px solid #ddd;">CANTIDAD (Lt)</td>
                <td style="font-weight: bold; font-size: 10px; padding: 4px; border: 1px solid #ddd;">FRECUENCIA DE CAMBIO (HR/KM)</td>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="font-size: 10px; padding: 4px; border: 1px solid #ddd;">${mantenimientos[0]?.otros_aceites_tipo || '-'}</td>
                <td style="font-size: 10px; padding: 4px; border: 1px solid #ddd;">${mantenimientos[0]?.otros_aceites_cantidad_lt || '-'}</td>
                <td style="font-size: 10px; padding: 4px; border: 1px solid #ddd;">${mantenimientos[0]?.otros_aceites_frecuencia_cambio || '-'}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Trabajos a Destinados Realizar -->
    <div style="margin-bottom: 24px;">
      <div style="font-size: 16px; font-weight: bold; margin-bottom: 16px; background-color: #f5f5f5; color: black; padding: 8px; border-radius: 4px;">TRABAJOS DESTINADOS A REALIZAR</div>
      
      <div style="font-size: 14px; font-weight: bold; margin-bottom: 16px; background-color: #f5f5f5; padding: 8px;">
        ${mantenimientos[0]?.trabajos_destinados_realizar || '-'}
      </div>
      
      <div style="display: flex; gap: 16px;">
        <div style="flex: 1;">
          <!-- Sistema de Combustible -->
          <div style="font-size: 12px; font-weight: bold; margin-bottom: 8px;">SISTEMA DE COMBUSTIBLE</div>
          <table style="border: 1px solid #ddd; width: 100%; border-collapse: collapse; margin-bottom: 16px;">
            <thead>
              <tr style="background-color: #f0f0f0;">
                <td style="font-weight: bold; font-size: 10px; padding: 4px; border: 1px solid #ddd;">GASOLINA</td>
                <td style="font-weight: bold; font-size: 10px; padding: 4px; border: 1px solid #ddd;">CANTIDAD (Lt)</td>
                <td style="font-weight: bold; font-size: 10px; padding: 4px; border: 1px solid #ddd;">CANTIDAD FILTROS</td>
                <td style="font-weight: bold; font-size: 10px; padding: 4px; border: 1px solid #ddd;">CODIGO FILTRO COMBUSTIBLE</td>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="font-size: 10px; padding: 4px; border: 1px solid #ddd;">${mantenimientos[0]?.gasolina || '-'}</td>
                <td style="font-size: 10px; padding: 4px; border: 1px solid #ddd;">${mantenimientos[0]?.gasolina_cantidad_lt || '-'}</td>
                <td style="font-size: 10px; padding: 4px; border: 1px solid #ddd;">${mantenimientos[0]?.cantidad_filtros || '-'}</td>
                <td style="font-size: 10px; padding: 4px; border: 1px solid #ddd;">${mantenimientos[0]?.codigo_filtro_combustible || '-'}</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div style="flex: 1;">
          <!-- Otros Filtros -->
          <div style="font-size: 12px; font-weight: bold; margin-bottom: 8px;">OTROS FILTROS</div>
          <table style="border: 1px solid #ddd; width: 100%; border-collapse: collapse; margin-bottom: 16px;">
            <thead>
              <tr style="background-color: #f0f0f0;">
                <td style="font-weight: bold; font-size: 10px; padding: 4px; border: 1px solid #ddd;">CANTIDAD</td>
                <td style="font-weight: bold; font-size: 10px; padding: 4px; border: 1px solid #ddd;">NUMERO</td>
                <td style="font-weight: bold; font-size: 10px; padding: 4px; border: 1px solid #ddd;">CAMBIO (HR/KM)</td>
                <td style="font-weight: bold; font-size: 10px; padding: 4px; border: 1px solid #ddd;">DESCRIPCION DEL FILTRO</td>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="font-size: 10px; padding: 4px; border: 1px solid #ddd;">${mantenimientos[0]?.otros_filtros_cantidad || '1'}</td>
                <td style="font-size: 10px; padding: 4px; border: 1px solid #ddd;">${mantenimientos[0]?.otros_filtros_numero || 'AB39-9601-AB'}</td>
                <td style="font-size: 10px; padding: 4px; border: 1px solid #ddd;">${mantenimientos[0]?.otros_filtros_cambio || '-'}</td>
                <td style="font-size: 10px; padding: 4px; border: 1px solid #ddd;">FILTRO DE AIRE</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Historial de Mantenimiento -->
    <div style="margin-bottom: 24px;">
      <div style="font-size: 16px; font-weight: bold; margin-bottom: 16px; background-color: #f5f5f5; color: black; padding: 8px; border-radius: 4px;">HISTORIAL DE MANTENIMIENTO</div>
      
      <div style="overflow-x: auto;">
        <table style="min-width: 1200px; width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background-color: #f0f0f0;">
              <td style="font-weight: bold; font-size: 10px; border: 1px solid #ddd; padding: 4px;">FECHA</td>
              <td style="font-weight: bold; font-size: 10px; border: 1px solid #ddd; padding: 4px;">N° SALIDA DE MATERIALES</td>
              <td style="font-weight: bold; font-size: 10px; border: 1px solid #ddd; padding: 4px;">DESCRIPCION, DAÑOS, EVENTOS, REPARACION REALIZADA</td>
              <td style="font-weight: bold; font-size: 10px; border: 1px solid #ddd; padding: 4px;">COSTO TOTAL Bs.</td>
              <td style="font-weight: bold; font-size: 10px; border: 1px solid #ddd; padding: 4px;">HOR/KM.</td>
              <td style="font-weight: bold; font-size: 10px; border: 1px solid #ddd; padding: 4px;">OPERADOR</td>
              <td style="font-weight: bold; font-size: 10px; border: 1px solid #ddd; padding: 4px;">ATENDIDO POR</td>
              <td style="font-weight: bold; font-size: 10px; border: 1px solid #ddd; padding: 4px;">ENCARGADO DE ACTIVOS FIJOS</td>
              <td style="font-weight: bold; font-size: 10px; border: 1px solid #ddd; padding: 4px;">UNIDAD/ EMPRESA</td>
              <td style="font-weight: bold; font-size: 10px; border: 1px solid #ddd; padding: 4px;">UBICACIÓN FISICO/ PROYECTO</td>
            </tr>
          </thead>
          <tbody>
            ${mantenimientos.map((mantenimiento, index) => `
              <tr style="${index % 2 === 0 ? 'background-color: #f9f9f9;' : ''}">
                <td style="font-size: 10px; border: 1px solid #ddd; padding: 4px;">${formatDateOnly(mantenimiento.fecha_mantenimiento)}</td>
                <td style="font-size: 10px; border: 1px solid #ddd; padding: 4px;">${mantenimiento.numero_salida_materiales || '-'}</td>
                <td style="max-width: 200px; font-size: 10px; border: 1px solid #ddd; padding: 4px;">${mantenimiento.descripcion_danos_eventos || mantenimiento.reparacion_realizada || '-'}</td>
                <td style="font-size: 10px; border: 1px solid #ddd; padding: 4px;">${mantenimiento.costo_total ? mantenimiento.costo_total.toLocaleString('es-BO', { minimumFractionDigits: 2 }) : '-'}</td>
                <td style="font-size: 10px; border: 1px solid #ddd; padding: 4px;">${mantenimiento.horas_kilometros ? mantenimiento.horas_kilometros.toLocaleString('es-BO') : '-'}</td>
                <td style="font-size: 10px; border: 1px solid #ddd; padding: 4px;">${mantenimiento.operador || '-'}</td>
                <td style="font-size: 10px; border: 1px solid #ddd; padding: 4px;">${mantenimiento.atendido_por || '-'}</td>
                <td style="font-size: 10px; border: 1px solid #ddd; padding: 4px;">${mantenimiento.encargado_activos_fijos || '-'}</td>
                <td style="font-size: 10px; border: 1px solid #ddd; padding: 4px;">${mantenimiento.unidad_empresa || '-'}</td>
                <td style="font-size: 10px; border: 1px solid #ddd; padding: 4px;">${mantenimiento.ubicacion_fisico_proyecto || '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
};

MantenimientoSection.propTypes = {
  maquinaria: PropTypes.object,
  mantenimientos: PropTypes.array,
};

export default MantenimientoSection;
