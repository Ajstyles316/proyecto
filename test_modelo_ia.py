import os
import sys
def test_modelo():
    print("PRUEBA DEL MODELO DE IA")
    print("="*30)
    model_dir = os.path.join('gestion_maquinaria', 'pronostico-v1')
    if not os.path.exists(model_dir):
        print(f"ERROR: No se encuentra el directorio: {model_dir}")
        return False
    original_dir = os.getcwd()
    os.chdir(model_dir)
    if not os.path.exists('pronostico_model.py'):
        print("ERROR: No se encuentra pronostico_model.py")
        os.chdir(original_dir)
        return False
    if os.getcwd() not in sys.path:
        sys.path.insert(0, os.getcwd())
    
    try:
        print("Importando modulo...")
        from pronostico_model import predecir_mantenimiento, verificar_modelo
        print("Verificando modelo...")
        if not verificar_modelo():
            print("ERROR: El modelo no esta listo")
            os.chdir(original_dir)
            return False
        
        print("Modelo verificado correctamente")
        casos_prueba = [
            {
                'nombre': 'Caso Normal',
                'datos': {'dias': 30, 'recorrido': 1000, 'horas_op': 150}
            },
            {
                'nombre': 'Caso Alto Riesgo',
                'datos': {'dias': 120, 'recorrido': 15000, 'horas_op': 3000}
            },
            {
                'nombre': 'Caso Bajo Riesgo',
                'datos': {'dias': 10, 'recorrido': 500, 'horas_op': 50}
            }
        ]
        print("\nEjecutando pruebas...")
        resultados = []        
        for caso in casos_prueba:
            print(f"\n{caso['nombre']}:")
            print(f"  Entrada: {caso['datos']}")
            
            try:
                resultado = predecir_mantenimiento(caso['datos'])
                
                print(f"  Prediccion: {resultado.get('resultado', 'N/A')}")
                print(f"  Riesgo: {resultado.get('riesgo', 'N/A')}")
                print(f"  Probabilidad: {resultado.get('probabilidad', 'N/A')}%")
                print(f"  Urgencia: {resultado.get('urgencia', 'N/A')}")
                
                resultados.append({
                    'caso': caso['nombre'],
                    'entrada': caso['datos'],
                    'salida': resultado,
                    'estado': 'EXITOSO'
                })
                
            except Exception as e:
                print(f"  ERROR: {e}")
                resultados.append({
                    'caso': caso['nombre'],
                    'entrada': caso['datos'],
                    'error': str(e),
                    'estado': 'ERROR'
                })
        
        os.chdir(original_dir)
        
        # Resumen
        print("\n" + "="*40)
        print("RESUMEN DE PRUEBAS")
        print("="*40)
        
        exitosos = len([r for r in resultados if r['estado'] == 'EXITOSO'])
        total = len(resultados)
        
        print(f"Exitosos: {exitosos}/{total}")
        print(f"Fallidos: {total - exitosos}/{total}")
        
        if exitosos == total:
            print("\nEl modelo esta funcionando correctamente!")
            return True
        else:
            print("\nHay problemas que necesitan atencion")
            return False
            
    except ImportError as e:
        print(f"ERROR: No se pudo importar el modulo: {e}")
        os.chdir(original_dir)
        return False
        
    except Exception as e:
        print(f"ERROR: {e}")
        os.chdir(original_dir)
        return False

if __name__ == "__main__":
    if test_modelo():
        print("\nPrueba completada exitosamente")
    else:
        print("\nPrueba fallida")
        sys.exit(1) 