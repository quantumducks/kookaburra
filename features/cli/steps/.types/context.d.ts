declare namespace toa.features.cli {
    type Context = {
        cwd?: string
        stdout?: string
        stderr?: string
        stdoutLines?: string[]
        stderrLines?: string[]
    }
}
