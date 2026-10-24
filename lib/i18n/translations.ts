// ============================================================================
// MAY-EXP-06 · Traducciones para la encuesta (i18n)
// ============================================================================

export type Language = 'es' | 'en';

export interface Translations {
  survey: {
    title: string;
    subtitle: string;
    sections: {
      profile: { title: string; subtitle: string };
      consent: { title: string; subtitle: string };
      change: { title: string; subtitle: string };
      review: { title: string; subtitle: string };
    };
    fields: {
      email: string;
      emailPlaceholder: string;
      optional: string;
      required: string;
      role: string;
      selectRole: string;
      experience: string;
      select: string;
      orgSize: string;
      sector: string;
      devsecopsExp: string;
      observations: string;
      observationsPlaceholder: string;
      changeId: string;
      arm: string;
      approvalTime: string;
      failedChange: string;
      controlViolation: string;
      yes: string;
      no: string;
      other: string;
    };
    roles: {
      devops: string;
      sre: string;
      developer: string;
      qa: string;
      security: string;
      platform: string;
      manager: string;
      lead: string;
    };
    experienceYears: {
      '0-2': string;
      '3-5': string;
      '6-10': string;
      '11-15': string;
      '16+': string;
    };
    orgSizes: {
      startup: string;
      small: string;
      medium: string;
      large: string;
      enterprise: string;
    };
    sectors: {
      tech: string;
      finance: string;
      health: string;
      ecommerce: string;
      telecom: string;
      govt: string;
      education: string;
    };
    devsecopsLevels: {
      none: string;
      basic: string;
      intermediate: string;
      advanced: string;
    };
    arms: {
      cab: string;
      policy: string;
      mayaguez: string;
    };
    covariates: {
      criticality: { label: string; low: string; high: string; tooltip: string };
      exposure: { label: string; low: string; high: string; tooltip: string };
      blastRadius: { label: string; low: string; high: string; tooltip: string };
      testCoverage: { label: string; low: string; high: string; tooltip: string };
      maturity: { label: string; low: string; high: string; tooltip: string };
    };
    consent: {
      privacy: string;
      privacyDesc: string;
      item1: string;
      item2: string;
      item3: string;
      item4: string;
    };
    buttons: {
      next: string;
      previous: string;
      review: string;
      submit: string;
    };
    messages: {
      autoCapture: string;
      autoCaptureDesc: string;
      location: string;
      loading: string;
      allReady: string;
      reviewDesc: string;
      confirmCorrect: string;
      submitted: string;
      submittedDesc: string;
    };
  };
}

export const translations: Record<Language, Translations> = {
  es: {
    survey: {
      title: 'Encuesta Profesionales de TI',
      subtitle: 'MAY-EXP-06: Modelo Mayagüez de Adopción DevSecOps',
      sections: {
        profile: {
          title: 'Sección 1 de 4: Perfil Profesional',
          subtitle: 'Información sobre tu rol y experiencia (solo una vez)',
        },
        consent: {
          title: 'Sección 2 de 4: Consentimiento Informado',
          subtitle: 'Tu privacidad y derechos',
        },
        change: {
          title: 'Sección 3 de 4: Datos del Cambio',
          subtitle: 'Información técnica sobre la solicitud de cambio',
        },
        review: {
          title: 'Sección 4 de 4: Revisión Final',
          subtitle: 'Verifica tus datos antes de enviar',
        },
      },
      fields: {
        email: 'Email profesional',
        emailPlaceholder: 'tu.email@empresa.com',
        optional: '(opcional)',
        required: '*',
        role: 'Rol profesional actual',
        selectRole: 'Selecciona tu rol...',
        experience: 'Años de experiencia en TI',
        select: 'Selecciona...',
        orgSize: 'Tamaño de tu organización',
        sector: 'Sector/Industria',
        devsecopsExp: 'Experiencia con DevSecOps',
        observations: 'Observaciones y comentarios',
        observationsPlaceholder: 'Agrega cualquier comentario adicional sobre este cambio...',
        changeId: 'ID del Cambio',
        arm: 'Brazo experimental (modelo de gobernanza)',
        approvalTime: 'Tiempo de aprobación (minutos)',
        failedChange: '¿El cambio falló al desplegarse?',
        controlViolation: '¿Hubo violación de control?',
        yes: 'Sí',
        no: 'No',
        other: 'Otro',
      },
      roles: {
        devops: 'DevOps Engineer',
        sre: 'Site Reliability Engineer (SRE)',
        developer: 'Software Developer',
        qa: 'QA/Test Engineer',
        security: 'Security Engineer',
        platform: 'Platform Engineer',
        manager: 'Engineering Manager',
        lead: 'Technical Lead',
      },
      experienceYears: {
        '0-2': '0-2 años',
        '3-5': '3-5 años',
        '6-10': '6-10 años',
        '11-15': '11-15 años',
        '16+': '16+ años',
      },
      orgSizes: {
        startup: 'Startup (1-50)',
        small: 'Pequeña (51-200)',
        medium: 'Mediana (201-1000)',
        large: 'Grande (1001-5000)',
        enterprise: 'Empresa (5000+)',
      },
      sectors: {
        tech: 'Tecnología/Software',
        finance: 'Finanzas/Banca',
        health: 'Salud',
        ecommerce: 'E-commerce',
        telecom: 'Telecomunicaciones',
        govt: 'Gobierno',
        education: 'Educación',
      },
      devsecopsLevels: {
        none: 'Ninguna',
        basic: 'Básica (< 1 año)',
        intermediate: 'Intermedia (1-3 años)',
        advanced: 'Avanzada (3+ años)',
      },
      arms: {
        cab: 'CAB_UNIFORM - Comité de Aprobación de Cambios tradicional',
        policy: 'POLICY_UNIFORM - Política uniforme basada en reglas',
        mayaguez: 'MAYAGUEZ_ADAPTIVE - Gobernanza adaptativa (Modelo Mayagüez)',
      },
      covariates: {
        criticality: {
          label: 'Criticidad del servicio',
          low: 'No crítico',
          high: 'Crítico',
          tooltip: '¿Qué tan importante es este servicio para la operación del negocio?',
        },
        exposure: {
          label: 'Exposición a producción',
          low: 'Desarrollo',
          high: 'Producción total',
          tooltip: '¿Qué porcentaje de usuarios finales están expuestos?',
        },
        blastRadius: {
          label: 'Radio de explosión (Blast Radius)',
          low: 'Aislado',
          high: 'Toda la plataforma',
          tooltip: '¿Cuántos sistemas/servicios se verían afectados si esto falla?',
        },
        testCoverage: {
          label: 'Cobertura de pruebas',
          low: '0%',
          high: '100%',
          tooltip: '% de cobertura de pruebas automatizadas',
        },
        maturity: {
          label: 'Madurez DevSecOps',
          low: 'Principiante',
          high: 'Maduro',
          tooltip: 'Nivel de adopción de prácticas DevSecOps',
        },
      },
      consent: {
        privacy: '🔒 Privacidad:',
        privacyDesc:
          'Tus datos serán anonimizados y usados únicamente para investigación científica. Tu IP no se almacena, solo un hash irreversible para detección de duplicados.',
        item1: 'Acepto participar voluntariamente en este estudio científico',
        item2: 'He leído y comprendo que mis datos serán anonimizados',
        item3: 'Autorizo el uso de mis datos para investigación académica',
        item4: 'Entiendo que puedo retirarme en cualquier momento',
      },
      buttons: {
        next: 'Siguiente →',
        previous: '← Anterior',
        review: 'Revisar →',
        submit: '🚀 Enviar Encuesta',
      },
      messages: {
        autoCapture: '📍 Captura automática:',
        autoCaptureDesc:
          'Fecha, hora, país y ciudad se registrarán automáticamente cuando envíes el formulario.',
        location: 'Ubicación detectada:',
        loading: 'Cargando...',
        allReady: '✓ Todo listo!',
        reviewDesc: 'Revisa la información abajo. Puedes volver atrás para editar cualquier campo.',
        confirmCorrect: 'Confirmo que toda la información es correcta y precisa',
        submitted: '¡Encuesta enviada con éxito!',
        submittedDesc:
          'Gracias por tu participación. Puedes enviar múltiples cambios usando el mismo perfil.',
      },
    },
  },
  en: {
    survey: {
      title: 'IT Professional Survey',
      subtitle: 'MAY-EXP-06: Mayagüez DevSecOps Adoption Model',
      sections: {
        profile: {
          title: 'Section 1 of 4: Professional Profile',
          subtitle: 'Information about your role and experience (one time)',
        },
        consent: {
          title: 'Section 2 of 4: Informed Consent',
          subtitle: 'Your privacy and rights',
        },
        change: {
          title: 'Section 3 of 4: Change Data',
          subtitle: 'Technical information about the change request',
        },
        review: {
          title: 'Section 4 of 4: Final Review',
          subtitle: 'Verify your data before submitting',
        },
      },
      fields: {
        email: 'Professional email',
        emailPlaceholder: 'your.email@company.com',
        optional: '(optional)',
        required: '*',
        role: 'Current professional role',
        selectRole: 'Select your role...',
        experience: 'Years of IT experience',
        select: 'Select...',
        orgSize: 'Your organization size',
        sector: 'Sector/Industry',
        devsecopsExp: 'DevSecOps experience',
        observations: 'Observations and comments',
        observationsPlaceholder: 'Add any additional comments about this change...',
        changeId: 'Change ID',
        arm: 'Experimental arm (governance model)',
        approvalTime: 'Approval time (minutes)',
        failedChange: 'Did the change fail when deployed?',
        controlViolation: 'Was there a control violation?',
        yes: 'Yes',
        no: 'No',
        other: 'Other',
      },
      roles: {
        devops: 'DevOps Engineer',
        sre: 'Site Reliability Engineer (SRE)',
        developer: 'Software Developer',
        qa: 'QA/Test Engineer',
        security: 'Security Engineer',
        platform: 'Platform Engineer',
        manager: 'Engineering Manager',
        lead: 'Technical Lead',
      },
      experienceYears: {
        '0-2': '0-2 years',
        '3-5': '3-5 years',
        '6-10': '6-10 years',
        '11-15': '11-15 years',
        '16+': '16+ years',
      },
      orgSizes: {
        startup: 'Startup (1-50)',
        small: 'Small (51-200)',
        medium: 'Medium (201-1000)',
        large: 'Large (1001-5000)',
        enterprise: 'Enterprise (5000+)',
      },
      sectors: {
        tech: 'Technology/Software',
        finance: 'Finance/Banking',
        health: 'Healthcare',
        ecommerce: 'E-commerce',
        telecom: 'Telecommunications',
        govt: 'Government',
        education: 'Education',
      },
      devsecopsLevels: {
        none: 'None',
        basic: 'Basic (< 1 year)',
        intermediate: 'Intermediate (1-3 years)',
        advanced: 'Advanced (3+ years)',
      },
      arms: {
        cab: 'CAB_UNIFORM - Traditional Change Advisory Board',
        policy: 'POLICY_UNIFORM - Uniform policy-based governance',
        mayaguez: 'MAYAGUEZ_ADAPTIVE - Adaptive governance (Mayagüez Model)',
      },
      covariates: {
        criticality: {
          label: 'Service criticality',
          low: 'Not critical',
          high: 'Critical',
          tooltip: 'How important is this service for business operations?',
        },
        exposure: {
          label: 'Production exposure',
          low: 'Development',
          high: 'Full production',
          tooltip: 'What % of end users are exposed?',
        },
        blastRadius: {
          label: 'Blast Radius',
          low: 'Isolated',
          high: 'Whole platform',
          tooltip: 'How many systems/services would be affected if this fails?',
        },
        testCoverage: {
          label: 'Test coverage',
          low: '0%',
          high: '100%',
          tooltip: '% of automated test coverage',
        },
        maturity: {
          label: 'DevSecOps maturity',
          low: 'Beginner',
          high: 'Mature',
          tooltip: 'Level of DevSecOps practices adoption',
        },
      },
      consent: {
        privacy: '🔒 Privacy:',
        privacyDesc:
          'Your data will be anonymized and used solely for scientific research. Your IP is not stored, only an irreversible hash for duplicate detection.',
        item1: 'I agree to voluntarily participate in this scientific study',
        item2: 'I have read and understand that my data will be anonymized',
        item3: 'I authorize the use of my data for academic research',
        item4: 'I understand that I can withdraw at any time',
      },
      buttons: {
        next: 'Next →',
        previous: '← Previous',
        review: 'Review →',
        submit: '🚀 Submit Survey',
      },
      messages: {
        autoCapture: '📍 Automatic capture:',
        autoCaptureDesc:
          'Date, time, country, and city will be automatically recorded when you submit the form.',
        location: 'Detected location:',
        loading: 'Loading...',
        allReady: '✓ All ready!',
        reviewDesc: 'Review the information below. You can go back to edit any field.',
        confirmCorrect: 'I confirm that all information is correct and accurate',
        submitted: 'Survey submitted successfully!',
        submittedDesc: 'Thank you for participating. You can submit multiple changes using the same profile.',
      },
    },
  },
};

export function useTranslations(lang: Language): Translations {
  return translations[lang];
}
