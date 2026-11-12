const courseImages = {
  1: '/images/classrooms/course-01-fundamentos-computacao-logica.webp',
  2: '/images/classrooms/course-02-algoritmos-estruturas-dados.webp',
  3: '/images/classrooms/course-03-programacao-orientada-objetos.webp',
  4: '/images/classrooms/course-04-html-css-pratica.webp',
  5: '/images/classrooms/course-05-desenvolvimento-java.webp',
  6: '/images/classrooms/course-06-banco-dados-sql.webp',
};

export function getCourseImage(courseId) {
  return courseImages[courseId] ?? null;
}
