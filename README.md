# Control y medida de consumo con interfaz web de una lavandería basado en LOGO

En el contexto actual, adquiere una importancia primordial la capacidad de gestionar de manera remota las operaciones de una empresa. Este enfoque permite supervisar el 
funcionamiento de la maquinaria, regular la iluminación y monitorear el consumo energético, entre muchas más posibilidades, en tiempo real de las instalaciones. Cuando este control se hace 
a través de una red (telefónica, ethernet, internet, etc) se le conoce como domótica.

De eso trata este proyecto. Su objetivo principal radica en establecer un control integral para varias facetas de la lavandería de autoservicio Wash-Ap. Esto incluye la administración de las 
máquinas (lavadoras y secadoras), de la verja de entrada, de las luces y del consumo eléctrico.

Todo esto se controlará por un autómata LOGO de Siemens, una solución reconocida en el campo. Una de sus características destacadas es la posibilidad de crear una interfaz web desde la 
que poder controlar la instalación.

_Toda la información del proyecto se encuentra dentro de EEI TFG.pdf_

## Objetivos

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

## Sofware usado

- LOGO!Soft Comfort V8.3
  
  Este software permite diseñar proyectos de automatización diseñados en FBD (diagrama de bloques funcionales) o en LAD (diagrama de contactos) para el PLC LOGO8.

- LOGO Web Editor
  
  LOGO! Web Editor se utiliza junto con LOGO! Base Module (BM) y LOGO! Soft Comfort. Esta herramienta ayuda a crear páginas web definidas por el usuario en el panel Editor y ver 
todo el proyecto a través del servidor web del PLC LOGO! Base Module.

- SEE Electrical
  
  Programa para esquemática eléctrica.

## PROGRAMA EN LOGO!SOFT COMFORT

### Control de las luces

![image](https://github.com/Hemonel/LOGO-home-automation-laundry/assets/153218898/a5db174f-f747-4859-af0b-ff0d3262b078)

El control de las luces se realiza de dos maneras, se cambia su estado desde un pulsador (a través de una entrada I) o desde el servidor web (a través de una marca M).

Cuando se recibe un pulso el bloque RS cambia su salida, si estaba a 0 pasa a 1 y viceversa.

El cable cortado comunica con la salida del reloj, de forma que a la hora de apertura si la luz no está encendida esta se enciende.

### Control de la verja

![image](https://github.com/Hemonel/LOGO-home-automation-laundry/assets/153218898/721b4ec2-9b34-4138-8b39-38eae61f24b4)

El control del portal se realiza de tres maneras, al pulsar un pulsador (entrada I4); al pulsar un botón digital a través del servidor web (marca M16), o se activa a través de un reloj, que se activa a la hora de apertura del local.

El reloj está para abrir, pero depende de la entrada I15 que está conectada un contacto magnético en la verja de entrada, de forma que detecta cuando está la verja cerrada.

Para asegurarse de que el controlador de la verja detecta la orden se ha puesto un mantenedor, que al recibir un “1” lo mantiene dos segundos, evitando así que el pulso sea tan corto que pase desapercibido.

### Control de las lavadoras y secadoras

![image](https://github.com/Hemonel/LOGO-home-automation-laundry/assets/153218898/c69f131c-0d77-4e97-9d58-2d0195b74d91)

El control físicamente solo permite 2 posibilidades, encendido de todas las máquinas o apagado de todas las máquinas a través de 2 pulsadores (I16 e I17).

Desde la interfaz web (a través de las marcas) se puede hacer esto mismo, pero también encender y apagar cada máquina por separado, obteniendo un mayor control.

### Lectura del estado de las lavadoras y secadoras

![image](https://github.com/Hemonel/LOGO-home-automation-laundry/assets/153218898/4777cddb-b0f9-41f5-9316-dd476cfeb880)

Esta parte del programa solamente se asegura de que el autómata lea las estradas, ya que con el estado no se realiza ningún proceso. Indica con un “1” si la máquina está trabajando y con un “0” si está en reposo.

### Lectura de las entradas analógicas

![image](https://github.com/Hemonel/LOGO-home-automation-laundry/assets/153218898/33b5525b-c924-4224-b2c2-cb69c1c45cbd)

Se leen las entradas analógicas y se calcula la potencia usando dos bloques de amplificación donde el rimero aporta un offset (ajusta el nivel de 0) y el segundo multiplica (corrige la escala).
Los resultados se almacenan en variables de memoria, estas variables permiten valores desde 0 hasta 10000.

### Pantalla LOGO

![image](https://github.com/Hemonel/LOGO-home-automation-laundry/assets/153218898/f34af9d8-3c81-40d5-b356-2062569514d4)

Los módulos principales LOGO tienen un display, a través de él se puede mostrar lo que se desee, en este caso ofrece la misma información que el servidor web pero de forma más compacta.
Cada bloque de texto de aviso indica que datos se deben mostrar en pantalla.

El control se realiza mediante un registro de desplazamiento (B055), que activa el bit de registro (S1.X) correspondiente al valor interno de este registro.

La lógica del circuito es que al pulsar el botón bajar (C2) se le suma una unidad al registro de desplazamiento, al pulsar el botón subir (C1) se le resta una unidad. Ambos botones tienen una entrada and unida a uno de los bits del registro, de forma que al llegar a la primera pantalla no se pueda seguir restando y tampoco se pude pasar de la última pantalla.

El bloque azul es la marca de inicio, está a “1” el primer ciclo del autómata, luego se comporta como una marca normal. Se utiliza para inicializar el registro.

## INTERFAZ WEB EN LOGO WEB EDITOR

### Página de inicio de sesión

![image](https://github.com/Hemonel/LOGO-home-automation-laundry/assets/153218898/547be1d0-9c23-4732-8d7f-cf2e097f260a)

Esta página es predeterminada de LOGO y no se diseña desde el LOGO Web Editor, sin embargo, es importante tomar en cuenta que esto es lo primero que verá el usuario al conectarse.

### Página inicial

![image](https://github.com/Hemonel/LOGO-home-automation-laundry/assets/153218898/9d47aa77-8652-4806-b455-fea8ec0f65d3)

La página permite visualizar y cambiar el estado de las luces, del rotulo y de la verja, además de mostrar la potencia consumida por toda la lavandería.

Utiliza una interfaz sencilla, en la que las luces están encendidas cuando el dibujo de la bombilla está encendido (además de poner ON), y también informa de forma cualitativa del consumo de la lavandería, de forma que cuando se está en verde el consumo es menor al límite impuesto por la compañía eléctrica (63 A o 43,47 kW).
