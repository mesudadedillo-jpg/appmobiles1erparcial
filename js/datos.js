/**
 * datos.js — Catálogo ficticio de mascotas.
 *
 * CÓMO AGREGAR FOTOS: guarda en la carpeta img/ un archivo por mascota con el
 * prefijo de su categoría y su número (según el orden de la lista):
 *   perro1.webp, perro2.webp ... perro10.webp, gato1.webp ... reptil10.webp
 * Tamaño recomendado: 400x300 px, formato WebP, menos de 40 KB cada una.
 * Si una foto no existe, se muestra la imagen de reemplazo de su categoría.
 */
const EXT_IMG = "svg";            // Extensión de fotos (webp, jpg, png...)
const MAX_POR_CATEGORIA = 10;      // Máximo de mascotas que se muestran por categoría

/* Cada mascota: [nombre, raza, edad, energía del 1 (calma) al 5 (muy activa)] */
const CATEGORIAS = [
  { nombre:"Perro", prefijo:"perro", cuidado:"Vacunado, desparasitado y esterilizado.", mascotas:[
    ["Luna","Labrador mestiza","2 años",4],["Rocky","Criollo","5 años",2],["Max","Pastor alemán","3 años",5],
    ["Canela","Beagle","4 años",4],["Toby","Schnauzer","6 años",2],["Mía","Chihuahua","1 año",3],
    ["Bruno","Golden retriever","7 años",2],["Kira","Husky siberiano","2 años",5],["Pelusa","Poodle","8 años",1],["Thor","Rottweiler","3 años",3]]},
  { nombre:"Gato", prefijo:"gato", cuidado:"Vacunado, esterilizado y con prueba de leucemia negativa.", mascotas:[
    ["Michi","Siamés","3 años",3],["Nube","Angora","4 años",2],["Tigre","Atigrado","2 años",4],
    ["Misifú","Criollo","1 año",5],["Salem","Negro doméstico","5 años",2],["Canelo","Naranja doméstico","6 meses",5],
    ["Cleo","Mau egipcio","3 años",3],["Pelito","Persa","7 años",1],["Mora","Bombay","2 años",3],["Simba","Maine Coon","4 años",3]]},
  { nombre:"Conejo", prefijo:"conejo", cuidado:"Desparasitado y acostumbrado a vivir en interiores.", mascotas:[
    ["Copito","Enano holandés","1 año",3],["Trébol","Cabeza de león","2 años",4],["Zanahoria","Mini lop","1 año",3],
    ["Nieve","Rex","3 años",2],["Bolita","Belier","2 años",2],["Canelita","Angora inglés","4 años",1],
    ["Saltarín","Holandés","1 año",5],["Orejitas","Mini lop","6 meses",4],["Pompón","Cabeza de león","3 años",3],["Lila","Enano","2 años",2]]},
  { nombre:"Ave", prefijo:"ave", cuidado:"Revisión veterinaria al día; necesita jaula amplia.", mascotas:[
    ["Kiwi","Perico australiano","6 meses",5],["Sol","Canario","2 años",4],["Lola","Cotorra argentina","5 años",4],
    ["Pipo","Ninfa","1 año",3],["Río","Agapornis","8 meses",5],["Perla","Periquito inglés","2 años",4],
    ["Gala","Diamante mandarín","1 año",3],["Chispa","Agapornis","3 años",4],["Mango","Canario roller","2 años",3],["Zazú","Loro frente azul","15 años",3]]},
  { nombre:"Roedor", prefijo:"roedor", cuidado:"Sano; necesita jaula con rueda y sustrato limpio.", mascotas:[
    ["Nuez","Hámster sirio","8 meses",4],["Chispa","Hámster ruso","1 año",5],["Gaspar","Cobayo","2 años",3],
    ["Canela","Cobayo peruano","3 años",2],["Ratita","Rata doméstica","1 año",4],["Bigotes","Jerbo","10 meses",5],
    ["Pico","Chinchilla","4 años",3],["Trufa","Cobayo abisinio","2 años",3],["Mochi","Hámster enano","6 meses",4],["Ardi","Degú","2 años",4]]},
  { nombre:"Reptil", prefijo:"reptil", cuidado:"Revisado por veterinario exótico; requiere terrario con lámpara UV.", mascotas:[
    ["Donatello","Tortuga de orejas rojas","10 años",1],["Rex","Dragón barbudo","3 años",2],["Gecko","Gecko leopardo","2 años",2],
    ["Kai","Iguana verde","5 años",2],["Pascual","Tortuga de caja","12 años",1],["Cami","Camaleón velado","2 años",2],
    ["Nagini","Serpiente del maíz","4 años",2],["Mica","Gecko crestado","3 años",2],["Rafa","Tortuga rusa","8 años",1],["Leo","Lagarto de lengua azul","6 años",1]]}
];

/* Lista plana de mascotas lista para usar. El id coincide con el nombre de la foto (perro1, gato3...) */
const MASCOTAS = CATEGORIAS.flatMap(cat =>
  cat.mascotas.slice(0, MAX_POR_CATEGORIA).map(([nombre, raza, edad, energia], i) => ({
    id: cat.prefijo + (i + 1), prefijo: cat.prefijo, cat: cat.nombre,
    nombre, raza, edad, energia, cuidado: cat.cuidado
  }))
);
