describe('configuration', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
    jest.resetModules();
  });

  const loadConfiguration = () => {
    let loaded: typeof import('./configuration').default;
    jest.isolateModules(() => {
      loaded = require('./configuration').default as typeof import('./configuration').default;
    });
    return loaded!;
  };

  it('uses safer production defaults for swagger and localhost CORS', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.SWAGGER_ENABLED;
    delete process.env.CORS_ALLOW_LOCALHOST;

    const config = loadConfiguration()();

    expect(config.app.env).toBe('production');
    expect(config.app.isProduction).toBe(true);
    expect(config.app.swaggerEnabled).toBe(false);
    expect(config.app.corsAllowLocalhost).toBe(false);
  });

  it('keeps developer-friendly defaults outside production', () => {
    process.env.NODE_ENV = 'development';
    delete process.env.SWAGGER_ENABLED;
    delete process.env.CORS_ALLOW_LOCALHOST;
    delete process.env.LOG_TO_FILES;

    const config = loadConfiguration()();

    expect(config.app.env).toBe('development');
    expect(config.app.swaggerEnabled).toBe(true);
    expect(config.app.corsAllowLocalhost).toBe(true);
    expect(config.rateLimit.globalLimit).toBe(100);
    expect(config.rateLimit.aiLimit).toBe(12);
    expect(config.logging.writeToFiles).toBe(false);
  });

  it('only enables file logging when explicitly configured', () => {
    process.env.LOG_TO_FILES = 'true';

    const config = loadConfiguration()();

    expect(config.logging.writeToFiles).toBe(true);
  });
});
