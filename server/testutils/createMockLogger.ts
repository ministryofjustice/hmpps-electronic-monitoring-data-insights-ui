import bunyan from 'bunyan'

const createMockLogger = () =>
  ({
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  }) as unknown as jest.Mocked<bunyan>

export default createMockLogger
