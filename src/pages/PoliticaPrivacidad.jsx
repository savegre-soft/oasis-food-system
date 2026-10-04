import SectionBadge from '../components/public/SectionBadge';

const SECTIONS = [
  {
    id: 'quienes-somos',
    title: '1. Quiénes somos',
    body: 'Oasis ("Oasis", "nosotros") ofrece comida preparada, shots funcionales Well Shot by Oasis y servicio de catering en la Zona Norte de Costa Rica. Esta política explica cómo tratamos tus datos personales cuando usás nuestro sitio web, nos escribís por WhatsApp o hacés un pedido.',
  },
  {
    id: 'datos',
    title: '2. Datos que recopilamos',
    body: 'Nombre, número de teléfono, correo electrónico, dirección y zona de entrega, detalles de tus pedidos y preferencias o alergias alimentarias que decidás compartir. También datos técnicos básicos de navegación (como tipo de dispositivo y páginas visitadas).',
  },
  {
    id: 'uso',
    title: '3. Para qué los usamos',
    body: 'Para gestionar y entregar tus pedidos, comunicarnos contigo sobre el estado de tu pedido, responder consultas y cotizaciones de catering, mejorar nuestro menú y servicio y, si lo autorizás, enviarte promociones.',
  },
  {
    id: 'whatsapp',
    title: '4. WhatsApp y terceros',
    body: 'Usamos WhatsApp para recibir y confirmar pedidos; esa comunicación también está sujeta a las políticas de privacidad de WhatsApp. No vendemos tus datos. Solo los compartimos con proveedores necesarios para operar (por ejemplo, entrega o alojamiento web) o cuando la ley lo exija.',
  },
  {
    id: 'cookies',
    title: '5. Cookies',
    body: 'El sitio puede usar cookies necesarias para su funcionamiento y, con tu consentimiento, cookies de analítica. Podés desactivarlas desde la configuración de tu navegador.',
  },
  {
    id: 'derechos',
    title: '6. Tus derechos',
    body: 'De acuerdo con la Ley N.º 8968 de Protección de la Persona frente al Tratamiento de sus Datos Personales, podés solicitar el acceso, rectificación, actualización o eliminación de tus datos, así como revocar tu consentimiento. También podés acudir a la PRODHAB.',
  },
  {
    id: 'conservacion',
    title: '7. Conservación y seguridad',
    body: 'Conservamos tus datos solo durante el tiempo necesario para los fines descritos y aplicamos medidas razonables para protegerlos.',
  },
  {
    id: 'contacto',
    title: '8. Contacto',
    body: 'Para cualquier consulta sobre esta política o tus datos, escribinos por WhatsApp o a nuestro correo de contacto.',
  },
  {
    id: 'cambios',
    title: '9. Cambios',
    body: 'Podemos actualizar esta política. Publicaremos cualquier cambio en esta página con su fecha de actualización.',
  },
];

const PoliticaPrivacidad = () => {
  return (
    <div>
      <section className="bg-oasis-olive-50 py-16">
        <div className="max-w-4xl mx-auto px-4 md:px-6">
          <span className="inline-block bg-oasis-butter text-oasis-butter-dark text-xs font-semibold px-3 py-1 rounded-full mb-4">
            Plantilla — revisar con un asesor legal antes de publicar
          </span>
          <SectionBadge>Legal</SectionBadge>
          <h1 className="font-display text-4xl md:text-5xl font-semibold text-oasis-ink mt-3">
            Política de privacidad
          </h1>
          <p className="mt-3 text-sm text-oasis-ink/50">Última actualización: [fecha]</p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 md:px-6 py-16 grid lg:grid-cols-[220px_1fr] gap-12">
        <aside className="hidden lg:block">
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-oasis-ink/40 mb-4">
            En esta página
          </p>
          <ul className="space-y-2 text-sm">
            {SECTIONS.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className="text-oasis-ink/60 hover:text-oasis-olive-700 transition"
                >
                  {s.title}
                </a>
              </li>
            ))}
          </ul>
        </aside>

        <div className="space-y-10">
          {SECTIONS.map((s) => (
            <div key={s.id} id={s.id}>
              <h2 className="font-display text-2xl font-semibold text-oasis-ink mb-3">{s.title}</h2>
              <p className="text-oasis-ink/70 leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PoliticaPrivacidad;
