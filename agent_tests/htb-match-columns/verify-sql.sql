-- SQL Verification Script for HTB Match Columns
-- Run this to verify the new CTEs work correctly

-- Test 1: HTB Exact Match CTE
-- Expected: Returns 'yes' or 'no' for each component_type
WITH htb_exact_matches AS (
  SELECT
    c.component_type,
    CASE
      WHEN EXISTS (
        SELECT 1 FROM htb_attribute_mapping_zebra_provided h
        WHERE LOWER(h.attribute_name_for_htb) = LOWER(c.component_type)
      ) THEN 'yes'
      ELSE 'no'
    END as htb_match
  FROM (SELECT DISTINCT component_type FROM config_option_component WHERE component_type IS NOT NULL LIMIT 5) c
)
SELECT * FROM htb_exact_matches;

-- Test 2: HTB Distance Match CTE
-- Expected: Returns jsonb array with value + matchPercentage
WITH htb_distance_matches AS (
  SELECT
    ct.component_type,
    jsonb_agg(
      jsonb_build_object(
        'value', ec2.value,
        'matchPercentage', ROUND(((1 - (ec.embedding_small <=> ec2.embedding_small)) * 100)::numeric, 1)
      ) ORDER BY (1 - (ec.embedding_small <=> ec2.embedding_small)) DESC
    ) FILTER (WHERE ec2.value IS NOT NULL) as htb_similar_matches
  FROM (SELECT DISTINCT component_type FROM config_option_component WHERE component_type IS NOT NULL LIMIT 3) ct
  LEFT JOIN embedding_cache ec ON ec.value = ct.component_type AND ec.source_column = 'attribute_label'
  LEFT JOIN embedding_cache ec2
    ON ec2.source_column = 'attribute_name_for_htb'
    AND ec.embedding_small IS NOT NULL
    AND ec2.embedding_small IS NOT NULL
    AND (1 - (ec.embedding_small <=> ec2.embedding_small)) >= 0.3
  GROUP BY ct.component_type
)
SELECT
  component_type,
  COALESCE(htb_similar_matches, '[]'::jsonb) as htb_similar_matches,
  jsonb_array_length(COALESCE(htb_similar_matches, '[]'::jsonb)) as match_count
FROM htb_distance_matches;

-- Test 3: Full Integration Test
-- Expected: All fields including htb_match and htb_similar_matches
WITH component_stats AS (
  SELECT
    component_type,
    COUNT(DISTINCT option_id) as product_count,
    COUNT(DISTINCT sequence_position) as position_count
  FROM config_option_component
  WHERE component_type IS NOT NULL
  GROUP BY component_type
  LIMIT 10
),
htb_exact_matches AS (
  SELECT
    c.component_type,
    CASE
      WHEN EXISTS (
        SELECT 1 FROM htb_attribute_mapping_zebra_provided h
        WHERE LOWER(h.attribute_name_for_htb) = LOWER(c.component_type)
      ) THEN 'yes'
      ELSE 'no'
    END as htb_match
  FROM (SELECT DISTINCT component_type FROM config_option_component WHERE component_type IS NOT NULL) c
),
htb_distance_matches AS (
  SELECT
    ct.component_type,
    jsonb_agg(
      jsonb_build_object(
        'value', ec2.value,
        'matchPercentage', ROUND(((1 - (ec.embedding_small <=> ec2.embedding_small)) * 100)::numeric, 1)
      ) ORDER BY (1 - (ec.embedding_small <=> ec2.embedding_small)) DESC
    ) FILTER (WHERE ec2.value IS NOT NULL) as htb_similar_matches
  FROM (SELECT DISTINCT component_type FROM config_option_component WHERE component_type IS NOT NULL) ct
  LEFT JOIN embedding_cache ec ON ec.value = ct.component_type AND ec.source_column = 'attribute_label'
  LEFT JOIN embedding_cache ec2
    ON ec2.source_column = 'attribute_name_for_htb'
    AND ec.embedding_small IS NOT NULL
    AND ec2.embedding_small IS NOT NULL
    AND (1 - (ec.embedding_small <=> ec2.embedding_small)) >= 0.3
  GROUP BY ct.component_type
)
SELECT
  cs.component_type,
  cs.product_count,
  cs.position_count,
  hem.htb_match,
  COALESCE(hdm.htb_similar_matches, '[]'::jsonb) as htb_similar_matches
FROM component_stats cs
LEFT JOIN htb_exact_matches hem ON cs.component_type = hem.component_type
LEFT JOIN htb_distance_matches hdm ON cs.component_type = hdm.component_type
ORDER BY cs.component_type;

-- Test 4: Data Availability Check
SELECT
  'htb_attributes' as table_name,
  COUNT(*) as count
FROM htb_attribute_mapping_zebra_provided
WHERE attribute_name_for_htb IS NOT NULL

UNION ALL

SELECT
  'htb_embeddings' as table_name,
  COUNT(*) as count
FROM embedding_cache
WHERE source_column = 'attribute_name_for_htb' AND embedding_small IS NOT NULL

UNION ALL

SELECT
  'component_types' as table_name,
  COUNT(DISTINCT component_type) as count
FROM config_option_component
WHERE component_type IS NOT NULL;
