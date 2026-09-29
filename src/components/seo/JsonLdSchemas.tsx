import React from 'react';

export function WebSiteJsonLd() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'CamelloOnline',
    alternateName: ['Camello Online', 'CamelloOnline Colombia', 'Camello Online Empleo'],
    url: 'https://www.camelloonline.com',
    description: 'Portal de empleo y plataforma de trabajo remoto líder en Colombia. Vacantes verificadas en tecnología, ventas, IA y servicio al cliente.',
    inLanguage: 'es-CO',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://www.camelloonline.com/?search={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function OrganizationJsonLd() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'CamelloOnline Colombia',
    alternateName: 'CamelloOnline',
    url: 'https://www.camelloonline.com',
    logo: 'https://www.camelloonline.com/favicon.ico',
    description: 'Plataforma y portal de trabajo digital que conecta talento colombiano con oportunidades de empleo presencial, híbrido y remoto en Colombia y el exterior.',
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'CO',
      addressRegion: 'Colombia',
    },
    sameAs: [
      'https://www.linkedin.com/company/camelloonline',
      'https://twitter.com/camelloonline',
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function FaqJsonLd() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: '¿Qué es CamelloOnline y cómo funciona?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'CamelloOnline es el portal de empleo moderno para Colombia y trabajo remoto internacional. Centraliza ofertas laborales reales y verificadas en áreas como Desarrollo de Software, Inteligencia Artificial, Ventas B2B, Soporte y Marketing, mostrando siempre requisitos y rangos salariales transparentes.',
        },
      },
      {
        '@type': 'Question',
        name: '¿Cómo puedo encontrar trabajo remoto que pague en dólares (USD) desde Colombia?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'En la sección "Remoto Internacional" y usando los filtros de modalidad "Remoto Mundial" o etiqueta "USD", puedes postularte directamente a empresas de Estados Unidos, Europa y Latinoamérica que contratan talento en Colombia con pago en moneda extranjera.',
        },
      },
      {
        '@type': 'Question',
        name: '¿Tiene algún costo postularme o crear mi perfil en CamelloOnline?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'No, CamelloOnline es 100% gratuito para candidatos y profesionales que buscan trabajo. Puedes consultar vacantes, filtrar por ciudad o tecnología y postularte sin ningún cobro ni intermediarios.',
        },
      },
      {
        '@type': 'Question',
        name: '¿En qué ciudades de Colombia hay ofertas de empleo disponibles?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'CamelloOnline cuenta con vacantes presenciales, híbridas y remotas para Bogotá D.C., Medellín, Cali, Barranquilla, Bucaramanga, Cartagena, Manizales, Pereira y toda Colombia.',
        },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function JobPostingJsonLd({ jobs }: { jobs: any[] }) {
  if (!jobs || jobs.length === 0) return null;

  // Render top 15 jobs for Google for Jobs schema indexing
  const topJobs = jobs.slice(0, 15).map((job) => {
    const companyName = job.companyName || job.company || 'Empresa Destacada';
    const location = job.locationCity || job.displayLocation || job.location || 'Colombia';
    const validThrough = new Date();
    validThrough.setDate(validThrough.getDate() + 60);

    const schema: Record<string, any> = {
      '@context': 'https://schema.org',
      '@type': 'JobPosting',
      title: job.title || 'Oferta de Empleo',
      description: job.description || `${job.title} en ${companyName}. Vacante de empleo verificada en CamelloOnline Colombia.`,
      datePosted: job.createdAt || job.postedAt || new Date().toISOString(),
      validThrough: validThrough.toISOString(),
      employmentType: 'FULL_TIME',
      hiringOrganization: {
        '@type': 'Organization',
        name: companyName,
        logo: job.companyLogo || 'https://www.camelloonline.com/favicon.ico',
      },
      jobLocation: {
        '@type': 'Place',
        address: {
          '@type': 'PostalAddress',
          addressCountry: 'CO',
          addressLocality: location,
        },
      },
    };

    const isRemote = job.isRemote || job.workModality === 'remote_worldwide' || job.workModality === 'remote_country' || /remoto|remote/i.test(location);
    if (isRemote) {
      schema.jobLocationType = 'TELECOMMUTE';
      schema.applicantLocationRequirements = {
        '@type': 'Country',
        name: 'Colombia',
      };
    }

    const minSal = job.salaryMin || job.salaryMinUsd || job.salaryMinUsdEquivalent;
    const maxSal = job.salaryMax || job.salaryMaxUsd || job.salaryMaxUsdEquivalent;
    if (minSal || maxSal) {
      schema.baseSalary = {
        '@type': 'MonetaryAmount',
        currency: job.currency || job.salaryCurrency || 'COP',
        value: {
          '@type': 'QuantitativeValue',
          minValue: minSal || maxSal,
          maxValue: maxSal || minSal,
          unitText: 'MONTH',
        },
      };
    }

    return schema;
  });

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(topJobs) }}
    />
  );
}
