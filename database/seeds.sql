-- ============================================================================
-- Semilla científica — SOLO MAY-EXP-06 (idempotente)
-- Los pesos del modelo NO se insertan como criterios de aceptación:
-- su fuente es src/experiment.py (testbed) y permanecen etiquetados como tales.
-- ============================================================================
INSERT INTO experiments (id, code, name, description)
VALUES ('00000000-0000-0000-0000-000000000606','MAY-EXP-06',
        'Gobernanza adaptativa',
        'Gobernanza adaptativa frente a CAB/gobernanza uniforme')
ON CONFLICT (code) DO NOTHING;

INSERT INTO experiment_versions (experiment_id, version, protocol_version, configuration, preregistration)
SELECT e.id,'1.0','1.0',
  $cfg${
    "arms": ["CAB_UNIFORM","POLICY_UNIFORM","MAYAGUEZ_ADAPTIVE"],
    "simulation": {"sample_size":300,"seeds":[101,202,303,404,505],"replications":2},
    "statistics": {"alpha":0.05,"confidence_level":0.95},
    "decision_thresholds": {"theta_high":0.20,"theta_low":-0.15,
      "source":"config.yaml thresholds.risk_high/risk_low (semantica: src/experiment.py)"},
    "non_inferiority": {"CFR":{"margin":0.03,"source":"PREREGISTRATION"},
                        "Violation":{"margin":0.02,"source":"PREREGISTRATION"}},
    "reference_arm": {"value":"PENDIENTE_DE_DEFINICION","candidate":"POLICY_UNIFORM",
      "note":"El preregistro no congela el brazo de referencia; src/experiment.py uso POLICY_UNIFORM"},
    "model_medians": {"cab":840,"policy":14,"mayaguez":15,
      "source":"config.yaml model.* (parametros del generador sintetico, NO observaciones)"},
    "risk_weights_source":"src/experiment.py (testbed, sha256 44e5cfa7...)",
    "trust_weights_source":"src/experiment.py (testbed)"
  }$cfg$::jsonb,
  $pre${
    "experiment_id":"MAY-EXP-06",
    "research_questions":["RQ06: Gobernanza adaptativa reduce friccion sin deterioro material de confiabilidad/cumplimiento?"],
    "primary_hypotheses":["ALT decreases","Human intervention decreases vs CAB",
      "CFR non-inferior delta=.03","Violations non-inferior delta=.02"],
    "primary_metrics":["ApprovalLeadTime","MIR","FTR","CFR","ViolationRate","EvidenceCompleteness"],
    "non_inferiority_margins":{"CFR":0.03,"Violation":0.02},
    "data_type":"SYNTHETIC"
  }$pre$::jsonb
FROM experiments e WHERE e.code='MAY-EXP-06'
ON CONFLICT (experiment_id, version) DO NOTHING;

INSERT INTO research_questions (experiment_id, code, statement)
SELECT id,'RQ06','¿Una estrategia de gobernanza adaptativa basada en riesgo, madurez y evidencia reduce la fricción de aprobación sin producir un deterioro material de confiabilidad, seguridad o cumplimiento respecto de una política uniforme?'
FROM experiments WHERE code='MAY-EXP-06'
ON CONFLICT (experiment_id, code) DO NOTHING;

INSERT INTO hypotheses (experiment_id, code, statement, htype, is_confirmatory)
SELECT e.id, v.code, v.stmt, v.htype, TRUE
FROM experiments e, (VALUES
 ('H0','La gobernanza adaptativa NO reduce la fricción y/o NO es no inferior al comparador.','H0'),
 ('H1a','La gobernanza adaptativa reduce el Approval Lead Time frente a CAB_UNIFORM.','H1'),
 ('H1b','La gobernanza adaptativa reduce la intervención humana (MIR) frente a CAB_UNIFORM.','H1'),
 ('H1c','El CFR adaptativo es no inferior al comparador con margen δ_CFR = 0.03.','H1'),
 ('H1d','La tasa de violaciones adaptativa es no inferior al comparador con margen δ_Violation = 0.02.','H1')
) AS v(code,stmt,htype)
WHERE e.code='MAY-EXP-06'
ON CONFLICT (experiment_id, code) DO NOTHING;

INSERT INTO variables (experiment_id, name, scientific_role, data_type, unit, definition, allowed_min, allowed_max, is_required)
SELECT e.id, v.name, v.role::var_role, v.dtype, v.unit, v.def, v.lo, v.hi, v.req
FROM experiments e, (VALUES
 ('unit_id','IDENTIFIER','text','—','Identificador único de la solicitud de cambio',NULL,NULL,TRUE),
 ('arm','INDEPENDENT','text','—','Brazo experimental asignado: CAB_UNIFORM | POLICY_UNIFORM | MAYAGUEZ_ADAPTIVE',NULL,NULL,TRUE),
 ('criticality','COVARIATE','float','0–1','Criticidad del servicio afectado por el cambio',0,1,TRUE),
 ('exposure','COVARIATE','float','0–1','Exposición al usuario/producción del cambio',0,1,TRUE),
 ('blast_radius','COVARIATE','float','0–1','Alcance potencial del fallo del cambio',0,1,TRUE),
 ('incident_history','COVARIATE','float','0–1','Historial normalizado de incidentes del componente',0,1,TRUE),
 ('policy_risk','COVARIATE','float','0–1','Riesgo de política asociado al cambio',0,1,TRUE),
 ('test_coverage','COVARIATE','float','0–1','Cobertura de pruebas (entra al riesgo como 1−T)',0,1,TRUE),
 ('maturity','COVARIATE','float','0–1','Madurez DevSecOps del equipo propietario',0,1,TRUE),
 ('evidence','COVARIATE','float','0–1','Calidad de la evidencia aportada por el cambio',0,1,TRUE),
 ('error_budget','COVARIATE','float','0–1','Salud del Error Budget (SRE)',0,1,TRUE),
 ('policy_compliance','COVARIATE','float','0–1','Cumplimiento de políticas del equipo/cambio',0,1,TRUE),
 ('observability','COVARIATE','float','0–1','Nivel de observabilidad del servicio',0,1,TRUE),
 ('risk','DERIVED','float','—','Risk Score ponderado (R_i)',NULL,NULL,FALSE),
 ('trust','DERIVED','float','—','Trust Score ponderado (Trust_i)',NULL,NULL,FALSE),
 ('autonomy_index','DERIVED','float','−1–1','Índice de autonomía AI = Trust − Risk',-1,1,FALSE),
 ('decision','DERIVED','text','—','Decisión: FAST_TRACK | AUTOMATED_GATES | HUMAN_REVIEW',NULL,NULL,FALSE),
 ('approval_minutes','DEPENDENT','float','minutos','Approval Lead Time en minutos',0,NULL,TRUE),
 ('failed_change','DEPENDENT','bool','—','Fallo del cambio desplegado (operacionalización del testbed)',NULL,NULL,TRUE),
 ('control_violation','DEPENDENT','bool','—','Violación de control (operacionalización del testbed)',NULL,NULL,TRUE),
 ('evidence_completeness','EVIDENCE','float','0–1','Completitud de evidencia del cambio',0,1,TRUE),
 ('human_intervention','DEPENDENT','bool','—','Intervención humana en la aprobación',NULL,NULL,TRUE),
 ('fast_track','DERIVED','bool','—','Decisión = FAST_TRACK',NULL,NULL,FALSE),
 ('experiment_id','IDENTIFIER','text','—','Aislamiento científico: siempre MAY-EXP-06',NULL,NULL,TRUE),
 ('seed','IDENTIFIER','int','—','Semilla de generación (datos sintéticos)',NULL,NULL,TRUE),
 ('replication','IDENTIFIER','int','—','Réplica dentro de la semilla',NULL,NULL,TRUE),
 ('data_type','IDENTIFIER','text','—','REAL | SYNTHETIC | MIXED',NULL,NULL,TRUE)
) AS v(name,role,dtype,unit,def,lo,hi,req)
WHERE e.code='MAY-EXP-06'
ON CONFLICT (experiment_id, name) DO NOTHING;

INSERT INTO metric_definitions (experiment_id, code, name, formula, unit, is_primary, definition_source)
SELECT e.id, v.code, v.name, v.formula, v.unit, TRUE, 'PREREGISTRATION'
FROM experiments e, (VALUES
 ('ApprovalLeadTime','Approval Lead Time','mediana(approval_minutes) por brazo','minutos'),
 ('MIR','Manual Intervention Rate','N(human_intervention)/N','proporción'),
 ('FTR','Fast-Track Rate','N(fast_track)/N','proporción'),
 ('CFR','Change Failure Rate','N(failed_change)/N','proporción'),
 ('ViolationRate','Policy Violation Rate','N(control_violation)/N','proporción'),
 ('EvidenceCompleteness','Evidence Completeness','media(evidence_completeness)','0–1')
) AS v(code,name,formula,unit)
WHERE e.code='MAY-EXP-06'
ON CONFLICT (experiment_id, code) DO NOTHING;

INSERT INTO acceptance_criteria (experiment_id, hypothesis_id, metric_code, operator, threshold, threshold_source, description)
SELECT e.id,
  (SELECT h.id FROM hypotheses h WHERE h.experiment_id=e.id AND h.code=v.hcode),
  v.metric, v.op, v.th, v.src, v.descr
FROM experiments e, (VALUES
 ('H1c','CFR','NOT_INFERIOR',0.03::double precision,'PROTOCOL',
  'Límite superior del IC95% de ΔCFR (MAYAGUEZ_ADAPTIVE − brazo de referencia) < 0.03'),
 ('H1d','ViolationRate','NOT_INFERIOR',0.02::double precision,'PROTOCOL',
  'Límite superior del IC95% de ΔViolationRate < 0.02'),
 ('H1a','ApprovalLeadTime','<',NULL::double precision,'PENDIENTE_DE_DEFINICION',
  'Reducción práctica de ALT: umbral no definido por el protocolo'),
 ('H1b','MIR','<',NULL::double precision,'PENDIENTE_DE_DEFINICION',
  'Reducción práctica de MIR: umbral no definido por el protocolo')
) AS v(hcode,metric,op,th,src,descr)
WHERE e.code='MAY-EXP-06'
ON CONFLICT DO NOTHING;

INSERT INTO claims (experiment_id, code, statement)
SELECT e.id,'C06','Dentro del testbed experimental, la política adaptativa reduce fricción y satisface los márgenes de no inferioridad preregistrados (δ_CFR=0.03; δ_Violation=0.02). Pendiente de validación externa.'
FROM experiments e WHERE e.code='MAY-EXP-06'
ON CONFLICT (experiment_id, code) DO NOTHING;

-- Bootstrap de administrador: NUNCA con contraseña en el repositorio.
-- Ejecutar manualmente:
--   psql "$DIRECT_DATABASE_URL" -c "INSERT INTO organizations(name,slug) VALUES ('<ORG>','<slug>');"
-- y crear el usuario con hash scrypt generado fuera del repositorio.
