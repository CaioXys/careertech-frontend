const courseCoverImages = {
  1: '/images/courses/course-01-fundamentos-computacao-logica.png',
  2: '/images/courses/course-02-algoritmos-estruturas-dados.png',
  3: '/images/courses/course-03-programacao-orientada-objetos.png',
  4: '/images/courses/course-04-html-css-pratica.png',
  5: '/images/courses/course-05-desenvolvimento-java.png',
  6: '/images/courses/course-06-banco-dados-sql.png',
  7: '/images/courses/course-07-backend-spring-boot.png',
  8: '/images/courses/course-08-apis-restful.png',
  9: '/images/courses/course-09-arquitetura-software-microsservicos.png',
  10: '/images/courses/course-10-fundamentos-banco-dados.png',
  11: '/images/courses/course-11-excel-planilhas-analise-dados.png',
  12: '/images/courses/course-12-sql-analise-dados.png',
  13: '/images/courses/course-13-python-analise-dados.png',
  14: '/images/courses/course-14-estatistica-analise-dados.png',
  15: '/images/courses/course-15-business-intelligence-power-bi.png',
  16: '/images/courses/course-16-engenharia-ciencia-dados.png',
  17: '/images/courses/course-17-computacao-sistemas-operacionais.png',
  18: '/images/courses/course-18-redes-computadores.png',
  19: '/images/courses/course-19-administracao-linux.png',
  20: '/images/courses/course-20-servidores-windows-linux.png',
  21: '/images/courses/course-21-virtualizacao-computacao-nuvem.png',
  22: '/images/courses/course-22-seguranca-informacao-redes.png',
  23: '/images/courses/course-23-devops-automacao-infraestrutura.png',
  24: '/images/courses/course-24-arquitetura-infraestrutura-cloud.png',
};

export function getCourseCoverImage(courseId) {
  return courseCoverImages[courseId] ?? null;
}
