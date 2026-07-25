package br.com.barberini.controller;

import br.com.barberini.dto.AtualizarStatusRequest;
import br.com.barberini.dto.BarbeiroRequest;
import br.com.barberini.dto.BloqueioRequest;
import br.com.barberini.dto.ReatribuirBarbeiroRequest;
import br.com.barberini.dto.ServicoRequest;
import br.com.barberini.service.AgendamentoService;
import br.com.barberini.service.CatalogoService;
import br.com.barberini.service.ResumoService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/dono")
public class DonoController {

    private final CatalogoService catalogo;
    private final AgendamentoService agendamentos;
    private final ResumoService resumos;

    public DonoController(CatalogoService catalogo, AgendamentoService agendamentos, ResumoService resumos) {
        this.catalogo = catalogo;
        this.agendamentos = agendamentos;
        this.resumos = resumos;
    }

    @GetMapping("/agendamentos")
    public List<Map<String, Object>> agenda(
            @RequestParam(defaultValue = "30") int dias,
            @RequestParam(defaultValue = "7") int diasAtras) {
        return agendamentos.todosProximos(dias, diasAtras);
    }

    @GetMapping("/resumo")
    public Map<String, Object> resumo(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate inicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fim) {
        return resumos.resumo(inicio, fim);
    }

    @PutMapping("/agendamentos/{id}/barbeiro")
    public Map<String, Object> reatribuirBarbeiro(
            @PathVariable Long id, @Valid @RequestBody ReatribuirBarbeiroRequest req) {
        return agendamentos.reatribuirBarbeiro(id, req.barbeiroId());
    }

    @PutMapping("/agendamentos/{id}/status")
    public Map<String, Object> atualizarStatus(
            @PathVariable Long id, @Valid @RequestBody AtualizarStatusRequest req) {
        return agendamentos.atualizarStatus(id, req.status(), req.valorCobrado());
    }

    @GetMapping("/barbeiros")
    public List<Map<String, Object>> barbeiros() {
        return catalogo.listarBarbeiros(false);
    }

    @PostMapping("/barbeiros")
    public Map<String, Object> criarBarbeiro(@Valid @RequestBody BarbeiroRequest req) {
        return catalogo.criarBarbeiro(req);
    }

    @PutMapping("/barbeiros/{id}")
    public Map<String, Object> atualizarBarbeiro(@PathVariable Long id, @Valid @RequestBody BarbeiroRequest req) {
        return catalogo.atualizarBarbeiro(id, req);
    }

    @GetMapping("/servicos")
    public List<Map<String, Object>> servicos() {
        return catalogo.listarServicos(false);
    }

    @PostMapping("/servicos")
    public Map<String, Object> criarServico(@Valid @RequestBody ServicoRequest req) {
        return catalogo.criarServico(req);
    }

    @PutMapping("/servicos/{id}")
    public Map<String, Object> atualizarServico(@PathVariable Long id, @Valid @RequestBody ServicoRequest req) {
        return catalogo.atualizarServico(id, req);
    }

    @GetMapping("/bloqueios")
    public List<Map<String, Object>> bloqueios(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate data) {
        return catalogo.listarBloqueios(data);
    }

    @PostMapping("/bloqueios")
    public Map<String, Object> criarBloqueio(@Valid @RequestBody BloqueioRequest req) {
        return catalogo.criarBloqueio(req);
    }

    @DeleteMapping("/bloqueios/{id}")
    public Map<String, String> removerBloqueio(@PathVariable Long id) {
        catalogo.removerBloqueio(id);
        return Map.of("message", "Horário reativado");
    }
}
