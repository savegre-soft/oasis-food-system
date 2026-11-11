import SectionBadge from '../components/public/SectionBadge';
import Seo from '../components/public/Seo';
import { WHATSAPP_LINK } from '../lib/siteContent';

// TOC del lateral — el `id` de cada entrada tiene que coincidir con el `id`
// del <Section> correspondiente más abajo.
const TOC = [
  { id: 'responsable', title: '1. Responsable del tratamiento' },
  { id: 'alcance', title: '2. Objeto y alcance' },
  { id: 'datos', title: '3. Datos que recopilamos' },
  { id: 'finalidades', title: '4. Para qué los usamos' },
  { id: 'base-legal', title: '5. Base legal y consentimiento' },
  { id: 'destinatarios', title: '6. Con quién los compartimos' },
  { id: 'transferencias', title: '7. Transferencias internacionales' },
  { id: 'conservacion', title: '8. Plazo de conservación' },
  { id: 'derechos', title: '9. Tus derechos (ARCO)' },
  { id: 'seguridad', title: '10. Seguridad de la información' },
  { id: 'menores', title: '11. Menores de edad' },
  { id: 'cookies', title: '12. Cookies y almacenamiento local' },
  { id: 'terceros', title: '13. Enlaces a sitios de terceros' },
  { id: 'cambios', title: '14. Cambios a esta política' },
  { id: 'contacto', title: '15. Contacto y autoridad de control' },
];

const Section = ({ id, title, children }) => (
  <div id={id}>
    <h2 className="font-display text-2xl font-semibold text-oasis-ink mb-3">{title}</h2>
    <div className="text-oasis-ink/70 leading-relaxed space-y-3">{children}</div>
  </div>
);

const PoliticaPrivacidad = () => {
  return (
    <div>
      <Seo
        title="Política de privacidad"
        description="Política de privacidad de Oasis: cómo tratamos tus datos personales al usar el sitio, escribirnos por WhatsApp o hacer un pedido."
        path="/politica-privacidad"
        noindex
      />

      <section className="bg-oasis-olive-50 py-16">
        <div className="max-w-4xl mx-auto px-4 md:px-6">
          <span className="inline-block bg-oasis-butter text-oasis-butter-dark text-xs font-semibold px-3 py-1 rounded-full mb-4">
            Borrador legal — pendiente de completar datos marcados entre [corchetes] y de revisión
            final por un abogado costarricense antes de publicar
          </span>
          <SectionBadge>Legal</SectionBadge>
          <h1 className="font-display text-4xl md:text-5xl font-semibold text-oasis-ink mt-3">
            Política de privacidad
          </h1>
          <p className="mt-3 text-sm text-oasis-ink/70">Última actualización: [fecha]</p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 md:px-6 py-16 grid lg:grid-cols-[240px_1fr] gap-12">
        <aside className="hidden lg:block">
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-oasis-ink/70 mb-4">
            En esta página
          </p>
          <ul className="space-y-2 text-sm">
            {TOC.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="text-oasis-ink/60 hover:text-oasis-olive-700 transition">
                  {s.title}
                </a>
              </li>
            ))}
          </ul>
        </aside>

        <div className="space-y-10">
          <Section id="responsable" title="1. Responsable del tratamiento">
            <p>
              El responsable del tratamiento de tus datos personales es{' '}
              <strong>[Razón social de Oasis / nombre del titular del negocio]</strong>, cédula [física o
              jurídica] número [número de cédula], con domicilio en [dirección física del negocio],
              Zona Norte, Costa Rica ("Oasis", "nosotros"), que opera este sitio web, el servicio de
              comida preparada, los shots funcionales Well Shot by Oasis y el servicio de catering.
            </p>
            <p>
              Para efectos de esta política, "datos personales" es cualquier información que te
              identifica o te hace identificable (nombre, teléfono, correo, dirección, etc.), y
              "tratamiento" es cualquier uso que le demos a esa información: recolectarla, guardarla,
              organizarla, consultarla, usarla o eliminarla.
            </p>
          </Section>

          <Section id="alcance" title="2. Objeto y alcance">
            <p>
              Esta política aplica a los datos personales que recolectamos a través de: (i) este sitio
              web público (incluyendo el menú, promociones, catering, formulario de contacto y
              solicitudes de pedido), (ii) el portal de pedidos para clientes registrados, y (iii) la
              comunicación directa por WhatsApp para coordinar pedidos, cotizaciones y confirmaciones.
            </p>
            <p>
              No aplica a datos de empleados o colaboradores de Oasis (que se rigen por su propia
              política interna) ni a sitios de terceros a los que este sitio pueda enlazar (ver sección
              13).
            </p>
          </Section>

          <Section id="datos" title="3. Datos que recopilamos">
            <p>Recolectamos distintos datos según cómo interactúes con nosotros:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Datos de contacto e identificación:</strong> nombre completo, número de
                teléfono, correo electrónico y dirección de entrega — cuando escribís por WhatsApp,
                llenás el formulario de contacto, pedís una promoción o un combo, o te registrás como
                cliente.
              </li>
              <li>
                <strong>Datos del pedido:</strong> productos o combos elegidos, cantidades, método y
                estado de pago, y preferencias o restricciones alimentarias/alergias que decidás
                compartirnos para preparar tu pedido de forma segura.
              </li>
              <li>
                <strong>Datos de ubicación aproximada:</strong> zona o ruta de entrega que indicás, para
                coordinar la logística de reparto.
              </li>
              <li>
                <strong>Datos técnicos básicos de navegación:</strong> tipo de dispositivo y navegador,
                páginas visitadas y preferencias guardadas en tu propio navegador (ver sección 12,
                "Cookies y almacenamiento local"). No usamos huellas digitales de dispositivo ni
                compramos datos a terceros para identificarte.
              </li>
              <li>
                <strong>Comunicaciones:</strong> el contenido de los mensajes que nos escribís por
                WhatsApp o por el formulario de contacto, para poder responderte.
              </li>
            </ul>
            <p>
              No recolectamos categorías especiales de datos personales (origen étnico, salud, creencias
              religiosas, afiliación sindical, orientación sexual, datos biométricos) salvo la
              información sobre alergias o restricciones alimentarias que vos mismo decidas
              compartirnos, de forma voluntaria y únicamente para preparar tu pedido de forma segura.
            </p>
          </Section>

          <Section id="finalidades" title="4. Para qué los usamos">
            <ul className="list-disc pl-5 space-y-2">
              <li>Gestionar, preparar y entregar tus pedidos, combos y servicios de catering.</li>
              <li>
                Comunicarnos con vos sobre el estado de tu pedido o solicitud, incluyendo confirmarla
                por WhatsApp antes de prepararla.
              </li>
              <li>Responder tus consultas, reclamos y cotizaciones de catering o eventos.</li>
              <li>
                Administrar tu cuenta si te registrás como cliente (incluyendo el portal de pedidos) y
                tu historial de compras.
              </li>
              <li>Gestionar cobros y conciliar pagos.</li>
              <li>Cumplir obligaciones legales, contables y tributarias.</li>
              <li>Mejorar nuestro menú, servicio y este sitio web.</li>
              <li>
                Si nos dejás tu contacto como persona interesada (no cliente todavía) o lo autorizás
                expresamente, enviarte información sobre promociones o novedades de Oasis.
              </li>
            </ul>
            <p>
              No usamos tus datos personales para tomar decisiones automatizadas que produzcan efectos
              jurídicos sobre vos, ni para fines distintos a los indicados sin pedirte tu consentimiento
              antes.
            </p>
          </Section>

          <Section id="base-legal" title="5. Base legal y consentimiento">
            <p>
              Tratamos tus datos personales con tu consentimiento informado, expreso e inequívoco
              (artículo 5 de la Ley N.º 8968), que nos das al: completar un formulario de este sitio,
              escribirnos por WhatsApp para pedir o cotizar algo, o registrarte como cliente. También
              tratamos los datos estrictamente necesarios para ejecutar el pedido o servicio que
              solicitaste (relación contractual) y los que debamos conservar por obligación legal
              (facturación, tributos).
            </p>
            <p>
              Podés retirar tu consentimiento en cualquier momento (ver sección 9), sin que eso afecte
              la validez de los tratamientos ya realizados antes de retirarlo, ni los que sigan siendo
              necesarios para cumplir un pedido ya confirmado o una obligación legal.
            </p>
          </Section>

          <Section id="destinatarios" title="6. Con quién los compartimos">
            <p>
              No vendemos, alquilamos ni intercambiamos tus datos personales con fines comerciales de
              terceros. Solo los compartimos con:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Nuestro personal de cocina, empaque y entrega</strong>, únicamente con la
                información necesaria para preparar y entregarte tu pedido.
              </li>
              <li>
                <strong>Proveedores de infraestructura tecnológica</strong> que almacenan y procesan
                datos en nuestro nombre bajo acuerdos de confidencialidad, como nuestro proveedor de
                base de datos y hosting (Supabase, Inc.). Estos proveedores actúan como encargados del
                tratamiento: solo tratan tus datos siguiendo nuestras instrucciones y para los fines
                aquí descritos, nunca para fines propios.
              </li>
              <li>
                <strong>WhatsApp / Meta Platforms, Inc.</strong>, como canal de comunicación que elegís
                usar para pedir, cotizar o confirmar un pedido. El tratamiento que WhatsApp hace de esas
                conversaciones se rige por su propia política de privacidad, ajena a Oasis.
              </li>
              <li>
                <strong>Autoridades públicas</strong>, cuando una ley, orden judicial o requerimiento de
                una autoridad competente nos obligue a entregar información puntual.
              </li>
            </ul>
          </Section>

          <Section id="transferencias" title="7. Transferencias internacionales">
            <p>
              Algunos de nuestros proveedores de infraestructura (por ejemplo, el proveedor de base de
              datos y hosting) pueden procesar y almacenar datos en servidores ubicados fuera de Costa
              Rica. En esos casos, exigimos contractualmente a esos proveedores niveles de protección de
              datos acordes a la Ley N.º 8968 y su Reglamento, y limitamos esas transferencias a lo
              estrictamente necesario para operar este sitio y el servicio.
            </p>
          </Section>

          <Section id="conservacion" title="8. Plazo de conservación">
            <p>
              Conservamos tus datos personales solo durante el tiempo necesario para cumplir las
              finalidades descritas en la sección 4, y como mínimo durante el plazo que exijan las
              obligaciones legales, contables o tributarias aplicables (por ejemplo, los registros de
              facturación). Si dejás de ser cliente activo o solicitás la eliminación de tus datos
              (sección 9), los eliminamos o anonimizamos una vez vencidos esos plazos legales mínimos de
              conservación.
            </p>
            <p>
              Los datos de personas interesadas que no llegan a convertirse en clientes (por ejemplo,
              quien escribe por el formulario de contacto sin hacer un pedido) se conservan por un plazo
              razonable para dar seguimiento comercial, y se eliminan si no hay actividad ni contacto
              posterior en un plazo de [12] meses.
            </p>
          </Section>

          <Section id="derechos" title="9. Tus derechos (ARCO)">
            <p>
              La Ley N.º 8968 de Protección de la Persona frente al Tratamiento de sus Datos Personales
              y su Reglamento (Decreto Ejecutivo N.º 37554-JP) te reconocen, entre otros, los siguientes
              derechos sobre tus propios datos:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Acceso:</strong> saber qué datos tuyos tenemos y cómo los usamos.
              </li>
              <li>
                <strong>Rectificación:</strong> corregir datos inexactos, incompletos o desactualizados.
              </li>
              <li>
                <strong>Cancelación (eliminación):</strong> pedir que eliminemos tus datos cuando ya no
                sean necesarios para los fines por los que los dimos, sujeto a los plazos legales de
                conservación de la sección 8.
              </li>
              <li>
                <strong>Oposición:</strong> oponerte a un tratamiento específico de tus datos (por
                ejemplo, dejar de recibir promociones).
              </li>
              <li>
                <strong>Revocar tu consentimiento</strong> en cualquier momento, sin efecto retroactivo.
              </li>
            </ul>
            <p>
              Podés ejercer cualquiera de estos derechos escribiéndonos a{' '}
              <strong>[correo de contacto de Oasis para temas de datos personales]</strong> o por{' '}
              <a href={WHATSAPP_LINK} target="_blank" rel="noreferrer" className="text-oasis-olive-700 font-semibold hover:underline">
                WhatsApp
              </a>
              , indicando tu nombre, el derecho que querés ejercer y un medio de contacto para
              responderte. Te responderemos en un plazo razonable y, en todo caso, dentro de los plazos
              que establece la normativa aplicable.
            </p>
            <p>
              Si considerás que no atendimos tu solicitud correctamente, podés presentar tu reclamo ante
              la <strong>Agencia de Protección de Datos de los Habitantes (PRODHAB)</strong>, la
              autoridad de control en Costa Rica en esta materia (
              <a href="https://www.prodhab.go.cr" target="_blank" rel="noreferrer" className="text-oasis-olive-700 font-semibold hover:underline">
                www.prodhab.go.cr
              </a>
              ).
            </p>
          </Section>

          <Section id="seguridad" title="10. Seguridad de la información">
            <p>
              Aplicamos medidas de seguridad técnicas y organizativas razonables para proteger tus datos
              personales frente a accesos no autorizados, pérdida, alteración o divulgación indebida —
              entre ellas, cifrado de la conexión (HTTPS), control de acceso por roles para nuestro
              personal, y restricciones a nivel de base de datos que limitan qué información puede leer
              o modificar cada tipo de usuario del sistema.
            </p>
            <p>
              Ninguna medida de seguridad es infalible. Si llegara a ocurrir una brecha de seguridad que
              afecte tus datos personales, te lo notificaremos junto con las autoridades competentes
              conforme lo exige la normativa aplicable.
            </p>
          </Section>

          <Section id="menores" title="11. Menores de edad">
            <p>
              Nuestros servicios están dirigidos a personas mayores de edad. No recolectamos
              intencionalmente datos personales de personas menores de edad sin el consentimiento
              verificable de su madre, padre o persona encargada. Si detectamos que recibimos datos de
              un menor sin ese consentimiento, los eliminaremos.
            </p>
          </Section>

          <Section id="cookies" title="12. Cookies y almacenamiento local">
            <p>
              Una "cookie" es un pequeño archivo que un sitio web guarda en tu navegador. Este sitio no
              usa cookies de rastreo de terceros ni cookies de publicidad. En su lugar, usa
              <strong> almacenamiento local de tu navegador (localStorage)</strong> — una tecnología
              similar, que tratamos con el mismo cuidado — únicamente para lo siguiente:
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-oasis-olive-100 rounded-xl overflow-hidden">
                <thead className="bg-oasis-olive-50 text-oasis-ink">
                  <tr>
                    <th className="text-left font-semibold px-4 py-2">Qué guarda</th>
                    <th className="text-left font-semibold px-4 py-2">Para qué</th>
                    <th className="text-left font-semibold px-4 py-2">Tipo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-oasis-olive-100">
                  <tr>
                    <td className="px-4 py-2">Tu sesión (si iniciaste sesión como cliente o personal)</td>
                    <td className="px-4 py-2">Mantenerte conectado sin pedirte la contraseña en cada página</td>
                    <td className="px-4 py-2">Esencial</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2">Tema de color (claro/oscuro)</td>
                    <td className="px-4 py-2">Recordar tu preferencia visual</td>
                    <td className="px-4 py-2">Esencial</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2">Tu elección de este banner de cookies</td>
                    <td className="px-4 py-2">No volver a preguntarte en cada visita</td>
                    <td className="px-4 py-2">Esencial</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2">Analítica de uso del sitio</td>
                    <td className="px-4 py-2">Entender qué páginas se visitan más, para mejorar el sitio</td>
                    <td className="px-4 py-2">Solo si aceptás — hoy no está activa</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p>
              Al entrar al sitio te mostramos un aviso para <strong>aceptar todas</strong> estas
              tecnologías o <strong>rechazar las no esenciales</strong>. Las esenciales (las 3 primeras
              filas de la tabla) siempre están activas porque el sitio no puede funcionar
              correctamente sin ellas — ningún dato personal tuyo sale de tu navegador por ese uso.
              Podés cambiar tu elección cuando quieras desde el enlace "Preferencias de cookies" en el
              pie de página, o borrando los datos de navegación de tu navegador.
            </p>
            <p>
              Hoy este sitio no tiene activa ninguna herramienta de analítica, publicidad o redes
              sociales de terceros. Si en el futuro agregamos alguna, actualizaremos esta sección y
              volveremos a pedirte tu consentimiento antes de activarla.
            </p>
          </Section>

          <Section id="terceros" title="13. Enlaces a sitios de terceros">
            <p>
              Este sitio puede incluir enlaces a WhatsApp, Instagram u otras plataformas de terceros.
              Esta política no cubre las prácticas de privacidad de esos sitios — te recomendamos leer
              sus propias políticas antes de compartirles información.
            </p>
          </Section>

          <Section id="cambios" title="14. Cambios a esta política">
            <p>
              Podemos actualizar esta política para reflejar cambios en nuestras prácticas, en nuestros
              servicios o en la normativa aplicable. Publicaremos cualquier cambio en esta misma página,
              junto con la fecha de la última actualización indicada arriba. Si el cambio es
              significativo, buscaremos avisarte por un canal adicional (por ejemplo, WhatsApp) antes de
              que entre en vigor.
            </p>
          </Section>

          <Section id="contacto" title="15. Contacto y autoridad de control">
            <p>
              Para cualquier consulta sobre esta política o sobre el tratamiento de tus datos
              personales, podés escribirnos a{' '}
              <strong>[correo de contacto de Oasis para temas de datos personales]</strong> o por{' '}
              <a href={WHATSAPP_LINK} target="_blank" rel="noreferrer" className="text-oasis-olive-700 font-semibold hover:underline">
                WhatsApp
              </a>
              .
            </p>
            <p>
              Autoridad de control en Costa Rica: Agencia de Protección de Datos de los Habitantes
              (PRODHAB) —{' '}
              <a href="https://www.prodhab.go.cr" target="_blank" rel="noreferrer" className="text-oasis-olive-700 font-semibold hover:underline">
                www.prodhab.go.cr
              </a>
              .
            </p>
          </Section>
        </div>
      </div>
    </div>
  );
};

export default PoliticaPrivacidad;
