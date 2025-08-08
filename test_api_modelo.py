import requests
import json
import time
from datetime import datetime

def test_api_endpoint():
    """Prueba el endpoint de pronóstico de la API"""
    print("🚀 PRUEBA DE INTEGRACIÓN CON API")
    print("="*40)
    base_url = "http://localhost:8000"
    endpoint = f"{base_url}/api/pronostico/"
    casos_prueba = [
        {
            'nombre': 'Caso Normal',
            'datos': {
                'dias': 30,
                'recorrido': 1000,
                'horas_op': 150
            }
        },
        {
            'nombre': 'Caso Alto Riesgo',
            'datos': {
                'dias': 120,
                'recorrido': 15000,
                'horas_op': 3000
            }
        },
        {
            'nombre': 'Caso Bajo Riesgo',
            'datos': {
                'dias': 10,
                'recorrido': 500,
                'horas_op': 50
            }
        },
        {
            'nombre': 'Caso Extremo',
            'datos': {
                'dias': 200,
                'recorrido': 25000,
                'horas_op': 5000
            }
        }
    ]
    
    resultados = []
    
    print(f"🌐 Probando endpoint: {endpoint}")
    print(f"📊 Total de casos: {len(casos_prueba)}")
    
    for i, caso in enumerate(casos_prueba, 1):
        print(f"\n📋 Caso {i}/{len(casos_prueba)}: {caso['nombre']}")
        print(f"   📤 Datos enviados: {caso['datos']}")
        
        try:
            # Realizar petición
            start_time = time.time()
            response = requests.post(
                endpoint,
                json=caso['datos'],
                headers={'Content-Type': 'application/json'},
                timeout=30
            )
            end_time = time.time()
            
            tiempo_respuesta = round((end_time - start_time) * 1000, 2)
            
            if response.status_code == 200:
                resultado = response.json()
                
                print(f"   ✅ Status: {response.status_code}")
                print(f"   ⏱️ Tiempo: {tiempo_respuesta}ms")
                print(f"   🎯 Predicción: {resultado.get('resultado', 'N/A')}")
                print(f"   ⚠️ Riesgo: {resultado.get('riesgo', 'N/A')}")
                print(f"   📊 Probabilidad: {resultado.get('probabilidad', 'N/A')}%")
                print(f"   🚨 Urgencia: {resultado.get('urgencia', 'N/A')}")
                
                resultados.append({
                    'caso': caso['nombre'],
                    'entrada': caso['datos'],
                    'salida': resultado,
                    'status_code': response.status_code,
                    'tiempo_ms': tiempo_respuesta,
                    'estado': 'EXITOSO'
                })
                
            else:
                print(f"   ❌ Status: {response.status_code}")
                print(f"   📄 Respuesta: {response.text}")
                
                resultados.append({
                    'caso': caso['nombre'],
                    'entrada': caso['datos'],
                    'status_code': response.status_code,
                    'respuesta': response.text,
                    'estado': 'ERROR'
                })
                
        except requests.exceptions.ConnectionError:
            print("   ❌ Error: No se pudo conectar al servidor")
            print("   💡 Asegúrate de que el servidor Django esté ejecutándose")
            
            resultados.append({
                'caso': caso['nombre'],
                'entrada': caso['datos'],
                'error': 'ConnectionError - Servidor no disponible',
                'estado': 'ERROR'
            })
            
        except requests.exceptions.Timeout:
            print("   ❌ Error: Timeout - La petición tardó demasiado")
            
            resultados.append({
                'caso': caso['nombre'],
                'entrada': caso['datos'],
                'error': 'Timeout - Petición tardó demasiado',
                'estado': 'ERROR'
            })
            
        except Exception as e:
            print(f"   ❌ Error inesperado: {e}")
            
            resultados.append({
                'caso': caso['nombre'],
                'entrada': caso['datos'],
                'error': str(e),
                'estado': 'ERROR'
            })
    
    # Generar reporte
    generar_reporte(resultados)
    
    return resultados

def generar_reporte(resultados):
    """Genera un reporte de las pruebas de API"""
    print("\n" + "="*50)
    print("📋 REPORTE DE PRUEBAS DE API")
    print("="*50)
    
    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    print(f"🕒 Fecha y hora: {timestamp}")
    
    # Estadísticas
    total = len(resultados)
    exitosos = len([r for r in resultados if r['estado'] == 'EXITOSO'])
    fallidos = total - exitosos
    
    print(f"\n📊 ESTADÍSTICAS:")
    print(f"   Total de pruebas: {total}")
    print(f"   Exitosas: {exitosos}")
    print(f"   Fallidas: {fallidos}")
    print(f"   Tasa de éxito: {(exitosos/total*100):.1f}%" if total > 0 else "N/A")
    
    # Tiempo promedio de respuesta
    tiempos = [r.get('tiempo_ms', 0) for r in resultados if r.get('tiempo_ms')]
    if tiempos:
        tiempo_promedio = sum(tiempos) / len(tiempos)
        tiempo_max = max(tiempos)
        tiempo_min = min(tiempos)
        
        print(f"\n⏱️ TIEMPOS DE RESPUESTA:")
        print(f"   Promedio: {tiempo_promedio:.2f}ms")
        print(f"   Máximo: {tiempo_max:.2f}ms")
        print(f"   Mínimo: {tiempo_min:.2f}ms")
    
    # Detalles por caso
    print(f"\n🔍 DETALLES POR CASO:")
    for i, resultado in enumerate(resultados, 1):
        status_icon = "✅" if resultado['estado'] == 'EXITOSO' else "❌"
        print(f"   {i}. {status_icon} {resultado['caso']}")
        
        if resultado['estado'] == 'EXITOSO':
            salida = resultado.get('salida', {})
            print(f"      Predicción: {salida.get('resultado', 'N/A')}")
            print(f"      Riesgo: {salida.get('riesgo', 'N/A')}")
            print(f"      Tiempo: {resultado.get('tiempo_ms', 'N/A')}ms")
        else:
            error = resultado.get('error', resultado.get('respuesta', 'Error desconocido'))
            print(f"      Error: {error}")
    
    # Recomendaciones
    print(f"\n💡 RECOMENDACIONES:")
    if fallidos == 0:
        print("   🎉 ¡La API está funcionando correctamente!")
        if tiempos and tiempo_promedio > 5000:
            print("   ⚠️ Los tiempos de respuesta son altos (>5s)")
    else:
        print("   ⚠️ Hay problemas que necesitan atención:")
        for resultado in resultados:
            if resultado['estado'] != 'EXITOSO':
                print(f"      - Revisar: {resultado['caso']}")
    
    print("\n" + "="*50)

def test_endpoints_adicionales():
    """Prueba endpoints adicionales relacionados con el modelo"""
    print("\n🔍 PROBANDO ENDPOINTS ADICIONALES")
    print("="*40)
    
    base_url = "http://localhost:8000"
    endpoints = [
        {
            'nombre': 'Resumen de Pronósticos',
            'url': f"{base_url}/api/pronostico/summary/",
            'method': 'GET'
        },
        {
            'nombre': 'Test API',
            'url': f"{base_url}/api/test/",
            'method': 'GET'
        }
    ]
    
    for endpoint in endpoints:
        print(f"\n📋 Probando: {endpoint['nombre']}")
        print(f"   🌐 URL: {endpoint['url']}")
        
        try:
            if endpoint['method'] == 'GET':
                response = requests.get(endpoint['url'], timeout=10)
            else:
                response = requests.post(endpoint['url'], timeout=10)
            
            if response.status_code == 200:
                print(f"   ✅ Status: {response.status_code}")
                try:
                    data = response.json()
                    print(f"   📊 Respuesta: {type(data).__name__}")
                except:
                    print(f"   📄 Respuesta: {response.text[:100]}...")
            else:
                print(f"   ❌ Status: {response.status_code}")
                print(f"   📄 Respuesta: {response.text}")
                
        except Exception as e:
            print(f"   ❌ Error: {e}")

if __name__ == "__main__":
    try:
        # Probar endpoint principal
        resultados = test_api_endpoint()
        
        # Probar endpoints adicionales
        test_endpoints_adicionales()
        
        # Guardar resultados
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        report_file = f"reporte_api_modelo_{timestamp}.json"
        
        report_data = {
            'timestamp': timestamp,
            'resultados': resultados
        }
        
        with open(report_file, 'w', encoding='utf-8') as f:
            json.dump(report_data, f, indent=2, ensure_ascii=False)
        
        print(f"\n💾 Reporte guardado en: {report_file}")
        
    except KeyboardInterrupt:
        print("\n⚠️ Prueba interrumpida por el usuario")
    except Exception as e:
        print(f"\n❌ Error general: {e}") 