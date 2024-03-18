# Control y medida de consumo con interfaz web de una lavandería basado en LOGO

En el contexto actual, adquiere una importancia primordial la capacidad de gestionar de manera remota las operaciones de una empresa. Este enfoque permite supervisar el 
funcionamiento de la maquinaria, regular la iluminación y monitorear el consumo energético, entre muchas más posibilidades, en tiempo real de las instalaciones. Cuando este control se hace 
a través de una red (telefónica, ethernet, internet, etc) se le conoce como domótica.

De eso trata este proyecto. Su objetivo principal radica en establecer un control integral para varias facetas de la lavandería de autoservicio Wash-Ap. Esto incluye la administración de las 
máquinas (lavadoras y secadoras), de la verja de entrada, de las luces y del consumo eléctrico.

Todo esto se controlará por un autómata LOGO de Siemens, una solución reconocida en el campo. Una de sus características destacadas es la posibilidad de crear una interfaz web desde la 
que poder controlar la instalación.

_Toda la información del proyecto se encuentra dentro de [EEI TFG.pdf](https://github.com/Hemonel/LOGO-home-automation-laundry/blob/master/EEI%20TFG.pdf), aquí solo se indicará la información relativa a la programación_

## 1 Objetivos

El objetivo principal de la nueva instalación es tener un control telemático de la lavandería casi total, de forma que para el funcionamiento de la misma no sea estrictamente necesario pasar 
por ella para que funcione correctamente.

Estos objetivos implican lo siguiente:
- Poder encender y apagar las luces interiores.
- Poder encender y apagar la luz que ilumina el rótulo exterior.
- Poder abrir y cerrar la verja que cubre la puerta de entrada.
- Poder encender y apagar las lavadoras y secadoras.
- Poder visualizar que lavadoras o secadoras están trabajando y cuales no.
- Todo lo anterior se debe controlar y/o visualizar desde una interfaz web.

Además, también se propusieron objetivos extra:
- Poder visualizar el consumo eléctrico de las máquinas.
- Encendido de la luz interior de forma automática a la hora de apertura del local.
- Apertura automática de la verja a la hora de apertura del local.

## 2 Sofware usado

- LOGO!Soft Comfort V8.3
  
  Este software permite diseñar proyectos de automatización diseñados en FBD (diagrama de bloques funcionales) o en LAD (diagrama de contactos) para el PLC LOGO8.

- LOGO Web Editor
  
  LOGO! Web Editor se utiliza junto con LOGO! Base Module (BM) y LOGO! Soft Comfort. Esta herramienta ayuda a crear páginas web definidas por el usuario en el panel Editor y ver 
todo el proyecto a través del servidor web del PLC LOGO! Base Module.

- SEE Electrical
  
  Programa para esquemática eléctrica.

## 3 PROGRAMA EN LOGO!SOFT COMFORT

### 3.1 Control de las luces

![image](https://github.com/Hemonel/LOGO-home-automation-laundry/assets/153218898/a5db174f-f747-4859-af0b-ff0d3262b078)

El control de las luces se realiza de dos maneras, se cambia su estado desde un pulsador (a través de una entrada I) o desde el servidor web (a través de una marca M).

Cuando se recibe un pulso el bloque RS cambia su salida, si estaba a 0 pasa a 1 y viceversa.

El cable cortado comunica con la salida del reloj, de forma que a la hora de apertura si la luz no está encendida esta se enciende.

### 3.2 Control de la verja

![image](https://github.com/Hemonel/LOGO-home-automation-laundry/assets/153218898/721b4ec2-9b34-4138-8b39-38eae61f24b4)

El control del portal se realiza de tres maneras, al pulsar un pulsador (entrada I4); al pulsar un botón digital a través del servidor web (marca M16), o se activa a través de un reloj, que se activa a la hora de apertura del local.

El reloj está para abrir, pero depende de la entrada I15 que está conectada un contacto magnético en la verja de entrada, de forma que detecta cuando está la verja cerrada.

Para asegurarse de que el controlador de la verja detecta la orden se ha puesto un mantenedor, que al recibir un “1” lo mantiene dos segundos, evitando así que el pulso sea tan corto que pase desapercibido.

### 3.3 Control de las lavadoras y secadoras

![image](https://github.com/Hemonel/LOGO-home-automation-laundry/assets/153218898/c69f131c-0d77-4e97-9d58-2d0195b74d91)

El control físicamente solo permite 2 posibilidades, encendido de todas las máquinas o apagado de todas las máquinas a través de 2 pulsadores (I16 e I17).

Desde la interfaz web (a través de las marcas) se puede hacer esto mismo, pero también encender y apagar cada máquina por separado, obteniendo un mayor control.

### 3.4 Lectura del estado de las lavadoras y secadoras

![image](https://github.com/Hemonel/LOGO-home-automation-laundry/assets/153218898/4777cddb-b0f9-41f5-9316-dd476cfeb880)

Esta parte del programa solamente se asegura de que el autómata lea las estradas, ya que con el estado no se realiza ningún proceso. Indica con un “1” si la máquina está trabajando y con un “0” si está en reposo.

### 3.5 Lectura de las entradas analógicas

![image](https://github.com/Hemonel/LOGO-home-automation-laundry/assets/153218898/33b5525b-c924-4224-b2c2-cb69c1c45cbd)

Se leen las entradas analógicas y se calcula la potencia usando dos bloques de amplificación donde el rimero aporta un offset (ajusta el nivel de 0) y el segundo multiplica (corrige la escala).
Los resultados se almacenan en variables de memoria, estas variables permiten valores desde 0 hasta 10000.

![image](https://github.com/Hemonel/LOGO-home-automation-laundry/assets/153218898/ce515f68-dbb0-4d64-9391-7969c1fac414)


### 3.6 Pantalla LOGO

![image](https://github.com/Hemonel/LOGO-home-automation-laundry/assets/153218898/f34af9d8-3c81-40d5-b356-2062569514d4)

Los módulos principales LOGO tienen un display, a través de él se puede mostrar lo que se desee, en este caso ofrece la misma información que el servidor web pero de forma más compacta.
Cada bloque de texto de aviso indica que datos se deben mostrar en pantalla.

El control se realiza mediante un registro de desplazamiento (B055), que activa el bit de registro (S1.X) correspondiente al valor interno de este registro.

La lógica del circuito es que al pulsar el botón bajar (C2) se le suma una unidad al registro de desplazamiento, al pulsar el botón subir (C1) se le resta una unidad. Ambos botones tienen una entrada and unida a uno de los bits del registro, de forma que al llegar a la primera pantalla no se pueda seguir restando y tampoco se pude pasar de la última pantalla.

El bloque azul es la marca de inicio, está a “1” el primer ciclo del autómata, luego se comporta como una marca normal. Se utiliza para inicializar el registro.

## 4 INTERFAZ WEB EN LOGO WEB EDITOR

### 4.1 Página de inicio de sesión

![image](https://github.com/Hemonel/LOGO-home-automation-laundry/assets/153218898/547be1d0-9c23-4732-8d7f-cf2e097f260a)

Esta página es predeterminada de LOGO y no se diseña desde el LOGO Web Editor, sin embargo, es importante tomar en cuenta que esto es lo primero que verá el usuario al conectarse.

### 4.2 Página inicial

![image](https://github.com/Hemonel/LOGO-home-automation-laundry/assets/153218898/9d47aa77-8652-4806-b455-fea8ec0f65d3)

La página permite visualizar y cambiar el estado de las luces, del rotulo y de la verja, además de mostrar la potencia consumida por toda la lavandería.

Utiliza una interfaz sencilla, en la que las luces están encendidas cuando el dibujo de la bombilla está encendido (además de poner ON), y también informa de forma cualitativa del consumo de la lavandería, de forma que cuando se está en verde el consumo es menor al límite impuesto por la compañía eléctrica (63 A o 43,47 kW).

#### 4.2.1 Descripción de funcionamiento de las luces

En las luces interiores y en la luz del rótulo el funcionamiento es el mismo, la bombilla y el texto a su lado apuntan a la misma variable (una salida), mientras que el botón está vinculado a una variable de memoria, que en el programa es la que actúa sobre la salida.

![image](https://github.com/Hemonel/LOGO-home-automation-laundry/assets/153218898/3dedfc7e-2faa-4760-b374-92d970e8e187)

#### 4.2.2 Descripción de funcionamiento de la verja

La configuración de la verja es similar, pero en este caso el texto apunta a la entrada a la que está conectada el sensor magnético de la verja.

![image](https://github.com/Hemonel/LOGO-home-automation-laundry/assets/153218898/e0a39481-6842-4352-8ec4-7b48c24e34a9)

#### 4.2.3 Descripción de funcionamiento del consumo total

Lo último permite visualizar el consumo total del local de forma aproximada, además de que indica si el consumo está dentro de los contratado con el color verde o se pasa con el color rojo.

![image](https://github.com/Hemonel/LOGO-home-automation-laundry/assets/153218898/435f9bc0-0546-4953-a9b0-ec68544cc483)

### 4.3 Página de control de lavadoras y secadoras

![image](https://github.com/Hemonel/LOGO-home-automation-laundry/assets/153218898/bc6bd95c-33d5-48f7-a081-0a9ec55201d4)

La página permite encender todas las máquinas; apagar todas las máquinas; apagar o encender cada maquina; visualizar si las maquinas están trabajando o no, y visualizar el consumo de cada una de ellas.

Cada sección informa con dibujos de la máquina o máquinas si están activas o no según si están en verde o en rojo el dibujo de la máquina; indica si están encendidas con un círculo verde y con un círculo rojo si no lo están; permite encenderlas o apagarlas con botón, y también pone el valor exacto del consumo actual de cada máquina o grupo de máquinas.

#### 4.3.1 Descripción de funcionamiento de los botones generales

En este apartado solo hay dos botones conectados a dos marcas.

![image](https://github.com/Hemonel/LOGO-home-automation-laundry/assets/153218898/5b91b84b-3edd-4091-885e-3385c28cd061)

#### 4.3.2 Descripción del funcionamiento del control de las lavadoras

Estas secciones permiten ver si las lavadoras están trabajando (el dibujo de la lavadora en rojo si está en paro y en verde si está en marcha); controlar su encendido y apagado a través de un botón que cambia su estado y un círculo de color que indica si están encendidas (verde) o apagadas (rojo), y ver el consumo por cada dos lavadoras.

![image](https://github.com/Hemonel/LOGO-home-automation-laundry/assets/153218898/c849b64b-8bc7-42ca-87bf-692e37393cd7)

![image](https://github.com/Hemonel/LOGO-home-automation-laundry/assets/153218898/0ca684cc-bc1c-45ec-b806-c20be6021a73)

#### 4.3.3 Descripción de funcionamiento del control de las secadoras

Estas secciones son similares a las de control de las lavadoras, sin embargo, aquí hay una medida de consumo por máquina.

![image](https://github.com/Hemonel/LOGO-home-automation-laundry/assets/153218898/8862a451-be4e-4cc8-bffd-a2fb6adc9fcf)

![image](https://github.com/Hemonel/LOGO-home-automation-laundry/assets/153218898/c7e63d2e-9a97-40c1-ada5-0f176b920447)

### 4.4 Página de gráficas

![image](https://github.com/Hemonel/LOGO-home-automation-laundry/assets/153218898/05b7842d-05a9-40c6-a8ad-aee828fa9d10)

La página da información sobre el consumo de toda la lavandería y de cada máquina en particular respecto al tiempo.

Cada recuadro da un histórico de la potencia consumida (en W o kW) de cada máquina para poder saber cuando y cuanto trabaja cada máquina.

![image](https://github.com/Hemonel/LOGO-home-automation-laundry/assets/153218898/2e67200c-b7fd-4505-9ba3-94c00fcfdeb0)

### 4.5 Navegador

![image](https://github.com/Hemonel/LOGO-home-automation-laundry/assets/153218898/9982588f-4bee-41e1-8ae4-3b98fabb4463)

El navegador es un menú desplegable que se encuentra oculto a la izquierda de la pantalla, al abrirlo permite seleccionar a que página ir o si cerrar sesión.

## 5 ANEXO III: BIBLIOGRAFÍA DE REFERENCIA

-	LOGO system manual ES: [LOGO! (siemens.com)](https://cache.industry.siemens.com/dl/files/041/109741041/att_924629/v1/logo_system_manual_es-ES_es-ES.pdf)
-	LOGO! 8 BasicoIntermedio: [LOGO8BasicoIntermedio (siemens.com)](https://assets.new.siemens.com/siemens/assets/api/uuid:3ebdbea1-16bd-48ef-98a7-7d1bcbab94dc/logo8basicointermedio.pdf)
-	LOGO! Web Editor Online Help: [LOGO! Web Editor Online Help (siemens.com)](https://assets.new.siemens.com/siemens/assets/api/uuid:0c8a5bd2-5503-4664-9d67-318a0bb7a312/Manual-LWEV1.1.pdf)
-	Reglamento Electrotécnico para Baja Tensión e Instrucciones Complementarias. 
