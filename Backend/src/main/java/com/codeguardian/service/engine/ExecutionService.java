package com.codeguardian.service.engine;

import com.codeguardian.payload.ExecutionRequestDto;
import com.codeguardian.payload.ExecutionResponseDto;
import org.springframework.stereotype.Service;

import java.io.*;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Service
public class ExecutionService {

    public ExecutionResponseDto execute(ExecutionRequestDto request) {
        String lang = request.getLanguage().toLowerCase();
        String code = request.getCode();
        String input = request.getInput() != null ? request.getInput() : "";

        try {
            Path tempDir = Files.createTempDirectory("codeguardian_exec_" + UUID.randomUUID());
            ExecutionResponseDto response;

            switch (lang) {
                case "java":
                    response = executeJava(tempDir, code, input);
                    break;
                case "python":
                    response = executePython(tempDir, code, input);
                    break;
                case "javascript":
                case "js":
                    response = executeNode(tempDir, code, input);
                    break;
                case "c":
                case "cpp":
                    response = executeCpp(tempDir, code, input, lang.equals("cpp"));
                    break;
                default:
                    return new ExecutionResponseDto("", "Language '" + lang + "' not supported yet.", "ERROR");
            }

            // Cleanup
            deleteDirectory(tempDir.toFile());
            return response;

        } catch (Exception e) {
            return new ExecutionResponseDto("", "Internal Server Error: " + e.getMessage(), "ERROR");
        }
    }

    private ExecutionResponseDto executeJava(Path dir, String code, String input) throws IOException, InterruptedException {
        // Java requires class name to match file name. We will assume Main.java for now. 
        // A smarter engine parses the code for public class, but we fallback to Main.
        String fileName = "Main.java";
        if (!code.contains("class Main")) {
            // Very naive check to swap name if a different public class exists.
            int start = code.indexOf("public class ");
            if (start != -1) {
                int end = code.indexOf("{", start);
                if (end != -1) {
                    fileName = code.substring(start + 13, end).trim() + ".java";
                }
            }
        }

        File javaFile = new File(dir.toFile(), fileName);
        Files.writeString(javaFile.toPath(), code);

        // Compile
        ProcessBuilder compilePb = new ProcessBuilder("javac", fileName);
        compilePb.directory(dir.toFile());
        Process compileProc = compilePb.start();
        
        String compileErr = readStream(compileProc.getErrorStream());
        if (!compileProc.waitFor(10, TimeUnit.SECONDS) || compileProc.exitValue() != 0) {
            return new ExecutionResponseDto("", "Compilation Error:\n" + compileErr, "ERROR");
        }

        // Run
        ProcessBuilder runPb = new ProcessBuilder("java", fileName.replace(".java", ""));
        return runProcess(runPb, dir.toFile(), input);
    }

    private ExecutionResponseDto executePython(Path dir, String code, String input) throws IOException, InterruptedException {
        File pyFile = new File(dir.toFile(), "script.py");
        Files.writeString(pyFile.toPath(), code);

        // Using "python" (or "python3" depending on OS environment)
        ProcessBuilder pb = new ProcessBuilder("python", "script.py");
        return runProcess(pb, dir.toFile(), input);
    }

    private ExecutionResponseDto executeNode(Path dir, String code, String input) throws IOException, InterruptedException {
        File jsFile = new File(dir.toFile(), "script.js");
        Files.writeString(jsFile.toPath(), code);

        ProcessBuilder pb = new ProcessBuilder("node", "script.js");
        return runProcess(pb, dir.toFile(), input);
    }

    private ExecutionResponseDto executeCpp(Path dir, String code, String input, boolean isCpp) throws IOException, InterruptedException {
        String ext = isCpp ? ".cpp" : ".c";
        String compiler = isCpp ? "g++" : "gcc";
        File cppFile = new File(dir.toFile(), "main" + ext);
        Files.writeString(cppFile.toPath(), code);

        // Compile
        ProcessBuilder compilePb = new ProcessBuilder(compiler, "main" + ext, "-o", "main.exe");
        compilePb.directory(dir.toFile());
        Process compileProc = compilePb.start();
        
        String compileErr = readStream(compileProc.getErrorStream());
        if (!compileProc.waitFor(15, TimeUnit.SECONDS) || compileProc.exitValue() != 0) {
            return new ExecutionResponseDto("", "Compilation Error:\n" + compileErr, "ERROR");
        }

        // Run
        ProcessBuilder runPb = new ProcessBuilder(new File(dir.toFile(), "main.exe").getAbsolutePath());
        return runProcess(runPb, dir.toFile(), input);
    }

    private ExecutionResponseDto runProcess(ProcessBuilder pb, File dir, String input) throws IOException, InterruptedException {
        pb.directory(dir);
        Process proc = pb.start();

        // Feed standard input if exists
        if (input != null && !input.isEmpty()) {
            try (BufferedWriter writer = new BufferedWriter(new OutputStreamWriter(proc.getOutputStream()))) {
                writer.write(input);
                writer.flush();
            }
        } else {
            proc.getOutputStream().close();
        }

        // Read streams in parallel to avoid hung processes
        StringBuilder stdOut = new StringBuilder();
        StringBuilder stdErr = new StringBuilder();

        Thread outThread = new Thread(() -> readToBuffer(proc.getInputStream(), stdOut));
        Thread errThread = new Thread(() -> readToBuffer(proc.getErrorStream(), stdErr));

        outThread.start();
        errThread.start();

        // Wait with timeout
        boolean finished = proc.waitFor(15, TimeUnit.SECONDS);
        
        outThread.join(1000);
        errThread.join(1000);

        if (!finished) {
            proc.destroyForcibly();
            return new ExecutionResponseDto(stdOut.toString(), "Execution Error: Time Limit Exceeded (15s)", "ERROR");
        }

        if (proc.exitValue() != 0) {
            return new ExecutionResponseDto(stdOut.toString(), "Runtime Error (Exit Code " + proc.exitValue() + "):\n" + stdErr.toString(), "ERROR");
        }

        return new ExecutionResponseDto(stdOut.toString(), stdErr.toString(), "COMPLETED");
    }

    private void readToBuffer(InputStream is, StringBuilder buffer) {
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(is))) {
            String line;
            while ((line = reader.readLine()) != null) {
                buffer.append(line).append("\n");
            }
        } catch (IOException e) {
            // Ignore stream closed
        }
    }

    private String readStream(InputStream is) throws IOException {
        StringBuilder sb = new StringBuilder();
        readToBuffer(is, sb);
        return sb.toString();
    }

    private void deleteDirectory(File currDir) {
        File[] allContents = currDir.listFiles();
        if (allContents != null) {
            for (File file : allContents) {
                deleteDirectory(file);
            }
        }
        currDir.delete();
    }
}
