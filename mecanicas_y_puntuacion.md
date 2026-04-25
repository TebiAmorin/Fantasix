# Lógica de Juego y Sistema de Puntuación

## 1\. Definición de Estadísticas (Inputs del Admin)

Para cada jugador en un partido, el admin registrará:

* **Kills / Deaths:** Bajas y muertes totales.
* **Entry K/D:** Primera baja o primera muerte de la ronda.
* **KOST:** % de rondas con Kill, Objective (plant/defuse), Survived o Traded. (Input: valor decimal 0.00 a 1.00).
* **Plants/Defuses:** Acciones de objetivo completadas.
* **Clutch Wins:** Rondas ganadas siendo el último vivo contra X enemigos.
* **Rounds Survived:** Cantidad de rondas que el jugador terminó con vida.

## 2\. Matriz de Puntuación (Scoring Matrix)

|Acción|Puntos|
|-|-|
|Kill|+2|
|Death|-1|
|Entry Kill|+2 (Total +4 por esa kill)|
|Entry Death|-1 (Total -2 por esa muerte)|
|Plant / Defuse|+4|
|Clutch 1vsX|+3 por cada enemigo vivo superado (1v1=+3, 1v2=+6, etc.)|
|KOST|Valor \* 10 (Ej: 0.80 = 8 puntos)|
|Survival|+1 por cada ronda sobrevivida|



