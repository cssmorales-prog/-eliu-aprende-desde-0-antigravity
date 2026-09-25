# Renovación del camión y otros beneficios del transporte de carga

Investigación de agosto 2026. Corrige lo que decía la versión anterior de `02-que-fondo-conviene.md`.

## Conclusión sobre la renovación del camión: descartada por dos motivos

### 1. El programa "Cambia tu Camión" ya no existe

Rastreando el programa, esto es lo que hubo:

- **Agencia Chilena de Eficiencia Energética (AChEE)**, convocatorias 2009 y 2011, más una convocatoria especial para Aysén
- **Sercotec**, una convocatoria alrededor de 2013, con subsidio de $6.000.000

Los requisitos de esa convocatoria de Sercotec eran: giro exclusivo de transporte de carga por carretera, ventas netas bajo 5.000 UF anuales, camión con antigüedad mayor al año 1988 (o sea 25 años o más), PBV igual o superior a 10 toneladas, camión a nombre del postulante por al menos 3 años, permiso de circulación y revisión técnica al día.

**No hay evidencia de una edición vigente.** Ni en el listado de programas de Sercotec 2026 ni en el calendario de convocatorias. Toda la información pública que se encuentra es de 2013.

### 2. El camión de Munnay es 2020

Aunque el programa reabriera con los mismos criterios, un camión de 6 años no califica. Estos programas apuntan a chatarrizar flota de 25 años o más.

Los programas de renovación que sí están activos en 2026 (**Renueva tu Micro**, **Renueva tu Colectivo**) son del Ministerio de Transportes y aplican a transporte público de pasajeros. Buses, minibuses, taxibuses y taxis colectivos. **No cubren transporte de carga.**

**Cierre del tema: no hay subsidio estatal para renovar el camión de Munnay, y no lo necesita.** Un camión 2020 es flota moderna. Eso además juega a favor en la postulación a Crece, porque el cuello de botella del negocio no es el fierro, es la capacidad comercial.

## Lo que sí puede estar dejando plata sobre la mesa

### Reintegro parcial del impuesto específico al diésel

Este es el beneficio más importante para Munnay y no es concursable. Se pide en el F29 todos los meses.

**Base legal:** Ley 19.764, mecanismo prorrogado por la Ley N° 21.755 publicada el 11 de julio de 2025, que extendió la vigencia **hasta el 31 de diciembre de 2026**.

**Escala de reintegro según ingresos anuales:**

| Ingresos anuales | % del impuesto específico que se recupera |
|---|---|
| **Hasta 2.400 UF** | **80%** |
| 2.401 a 6.000 UF | 70% |
| 6.001 a 20.000 UF | 52,5% |
| Sobre 20.000 UF | 31% |

Munnay, con ventas estimadas en ~1.128 UF anuales, cae en el **tramo de 80%**. El máximo de la escala.

**Cómo se declara.** Formulario 29, línea 45:

| Código | Qué va |
|---|---|
| 729 | Metros cúbicos de diésel comprados |
| 744 | Componente base recuperable |
| 745 | Componente variable |
| 544 | Crédito fiscal IEPD total |
| 741 | Si resulta débito en vez de crédito |

**Cuánto es en plata.** El impuesto específico al diésel tiene un componente base de 1,5 UTM por metro cúbico, ajustado semanalmente por el MEPCO. Con UTM de agosto 2026 en $71.649:

```
1,5 UTM/m³ × $71.649 = $107.474 por m³ = ~$107 por litro
Recuperable al 80%              = ~$86 por litro
```

Estimación para la operación de Munnay (26 viajes al mes en el corredor Mejillones–Antofagasta):

| Supuesto | Valor |
|---|---|
| Litros de diésel al mes | ~1.200 `[SUPUESTO — reemplazar con el consumo real]` |
| Impuesto específico soportado | ~$128.000 |
| Recuperable al 80% | **~$103.000 al mes** |
| **Al año** | **~$1.230.000** |

Ese número es del orden de un cuarto de una factura mensual. Vale la pena revisarlo.

**Señal de alerta desde tu propio ERP:** la columna `IMPTO. ESPECIFICO` de la planilla MUNNAY ERP v4 está **vacía en todos los registros**, en 2024 y 2025. Eso no prueba que no se esté recuperando, porque la recuperación ocurre en el F29 y la lleva el contador, no la planilla. Pero es la primera cosa que hay que preguntar.

**Qué preguntarle al contador, textual:**

> "¿Estamos declarando el reintegro parcial del impuesto específico al diésel en la línea 45 del F29? ¿En qué tramo de la escala nos tiene, y desde qué mes lo venimos declarando?"

Si la respuesta es que no se está haciendo, hay que ver desde cuándo se puede rectificar.

**Requisitos para acceder** `[VERIFICAR con el contador]`: ser empresa de transporte de carga, propietaria o arrendataria con opción de compra del camión, con PBV sobre el mínimo legal, y con las facturas de compra de combustible a nombre de la empresa. Esto último importa: **si el diésel se compra con boleta o a nombre personal, no se puede recuperar nada.**

**Ojo con la Ley N° 21.811** (publicada el 26 de marzo de 2026): restringió transitoriamente al 31% la recuperación del IEPD entre el 26-03-2026 y el 30-09-2026. Según el análisis del Centro de Estudios Tributarios de la Universidad de Chile, esa restricción apunta a los contribuyentes de IVA que usan diésel en vehículos que **no** transitan por vías públicas, es decir uso industrial y minero. El transporte de carga por carretera opera bajo el mecanismo de la Ley 19.764, que es distinto. `[VERIFICAR con el contador si les afecta o no]`

### Certificación Giro Limpio

Programa del Ministerio de Energía y la Agencia de Sostenibilidad Energética, dirigido a empresas de transporte de carga, generadores de carga y operadores logísticos. **La certificación 2026 está abierta.**

Postulación 100% digital en girolimpio.cl. Se completan los reportes operacionales del año 2025 y, si corresponde, un plan de acción de eficiencia energética.

**Por qué importa para Munnay específicamente:** los clientes son Molycop, Magotteaux y terminales portuarios. Empresas de ese tamaño tienen compromisos de reducción de emisiones y miden a sus proveedores de transporte. Una certificación Giro Limpio es un argumento comercial concreto frente a un generador de carga nuevo, que es exactamente el problema H-03 que hay que resolver.

Además sirve doble: es evidencia de gestión energética que refuerza una postulación a **Crece Sostenible**.

## Lo que NO aplica, para no perder tiempo

**Bono a Transportistas 2026.** $100.000 mensuales para combustible, entre abril y septiembre de 2026, con plazo hasta el 30 de septiembre. Se pide en el portal Cero Filas de Subtrans con ClaveÚnica y se paga en un bolsillo electrónico de la CuentaRUT.

**Pero es solo para taxi básico, taxi colectivo, transporte escolar y el servicio Arica-Tacna.** El vehículo debe estar vigente en el Registro Nacional de Servicios de Transporte Público y Escolar. El transporte de carga queda fuera. Munnay no puede postular.

## Si en algún momento se necesita otro camión

No hay subsidio, pero sí hay garantías estatales que abaratan el crédito o el leasing:

| Instrumento | Cobertura | Tope |
|---|---|---|
| **Garantía CORFO** (FOGAIN) | Hasta 80% del financiamiento. Cubre crédito comercial, leasing, leaseback y factoring | UF 18.000 |
| **FOGAPE** | Complementario a CORFO | UF 15.000 |

Se piden a través de un banco, no directamente a CORFO. BancoEstado y la banca comercial las operan. Con leasing el camión queda como activo financiado y no compite con ninguna postulación Sercotec.

## Fuentes

- [SII — ¿Las empresas de transporte de carga pueden recuperar el impuesto al diésel?](https://www.sii.cl/preguntas_frecuentes/impuestos_mensuales/001_130_1542.htm)
- [SII — Valores UTM 2026](https://www.sii.cl/valores_y_fechas/utm/utm2026.htm)
- [Senado — Transporte de carga: renuevan mecanismo de reintegro parcial del impuesto específico al diésel](https://www.senado.cl/noticias/transportes/transporte-de-carga-renuevan-mecanismo-de-reintegro-parcial-del)
- [PortalPortuario — Extienden reintegro del impuesto específico al diésel para transporte de carga](https://portalportuario.cl/chile-extienden-reintegro-del-impuesto-especifico-al-petroleo-diesel-para-transporte-de-carga/)
- [Centro de Estudios Tributarios U. de Chile — Reporte Tributario N°180](https://cetuchile.cl/reportetributario/pdf/rt180.pdf)
- [Giro Limpio — Certificación 2026](https://www.girolimpio.cl/2025/10/21/%F0%9F%9A%9B-giro-limpio-2026-certifica-tu-compromiso-y-lidera-la-sostenibilidad-en-el-transporte-de-carga/)
- [Ministerio de Energía — Giro Limpio certifica 180 nuevos socios](https://energia.gob.cl/noticias/nacional/giro-limpio-avanza-en-el-transporte-de-carga-sostenible-certificando-180-nuevos-socios-transportistas-generadores-de-carga-y-operadores-logisticos)
- [ChileAtiende — Bono a Transportistas 2026](https://www.chileatiende.gob.cl/fichas/142445-bono-a-transportistas-2026)
- [MTT — Inscripciones para el bono y medidas de apoyo para transportistas](https://mtt.gob.cl/inscripciones-para-el-bono-y-medidas-de-apoyo-para-transportistas/)
- [MundoMudanzas — Cambia tu camión con el subsidio de Sercotec (histórico, 2013)](https://www.mundomudanzas.cl/articulos/cambia-tu-camion-con-el-subsidio-de-sercotec)
- [BancoEstado — CORFO FOGAIN](https://www.bancoestado.cl/content/bancoestado-public/cl/es/home/inicio---bancoestado-empresas/productos/garantias-estatales---bancoestado-empresas/corfo---fogain---bancoestado-empresas.html)
