import { runLookfantasticSync } from '../../app/api/awin/lib';

runLookfantasticSync().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(JSON.stringify({ ok: false, error: message }, null, 2));
  process.exit(1);
});
