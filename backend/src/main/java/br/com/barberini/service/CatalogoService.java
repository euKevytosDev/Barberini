package br.com.barberini.service;

import br.com.barberini.dto.BarbeiroRequest;
import br.com.barberini.dto.BloqueioRequest;
import br.com.barberini.dto.ServicoRequest;
import br.com.barberini.model.Barbeiro;
import br.com.barberini.model.BloqueioHorario;
import br.com.barberini.model.Servico;
import br.com.barberini.repository.BarbeiroRepository;
import br.com.barberini.repository.BloqueioHorarioRepository;
import br.com.barberini.repository.ServicoRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class CatalogoService {

    private final BarbeiroRepository barbeiros;
    private final ServicoRepository servicos;
    private final BloqueioHorarioRepository bloqueios;

    public CatalogoService(BarbeiroRepository barbeiros, ServicoRepository servicos, BloqueioHorarioRepository bloqueios) {
        this.barbeiros = barbeiros;
        this.servicos = servicos;
        this.bloqueios = bloqueios;
    }

    public List<Map<String, Object>> listarBarbeiros(boolean soAtivos) {
        List<Barbeiro> lista = soAtivos ? barbeiros.findByAtivoTrueOrderByNomeAsc() : barbeiros.findAllByOrderByNomeAsc();
        return lista.stream().map(this::mapBarbeiro).toList();
    }

    public Map<String, Object> criarBarbeiro(BarbeiroRequest req) {
        Barbeiro b = new Barbeiro();
        aplicarBarbeiro(b, req);
        return mapBarbeiro(barbeiros.save(b));
    }

    public Map<String, Object> atualizarBarbeiro(Long id, BarbeiroRequest req) {
        Barbeiro b = barbeiros.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Barbeiro não encontrado"));
        aplicarBarbeiro(b, req);
        return mapBarbeiro(barbeiros.save(b));
    }

    public List<Map<String, Object>> listarServicos(boolean soAtivos) {
        List<Servico> lista = soAtivos ? servicos.findByAtivoTrueOrderByNomeAsc() : servicos.findAllByOrderByNomeAsc();
        return lista.stream().map(this::mapServico).toList();
    }

    public Map<String, Object> criarServico(ServicoRequest req) {
        Servico s = new Servico();
        aplicarServico(s, req);
        return mapServico(servicos.save(s));
    }

    public Map<String, Object> atualizarServico(Long id, ServicoRequest req) {
        Servico s = servicos.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Serviço não encontrado"));
        aplicarServico(s, req);
        return mapServico(servicos.save(s));
    }

    public Map<String, Object> criarBloqueio(BloqueioRequest req) {
        BloqueioHorario b = new BloqueioHorario();
        b.setData(req.data());
        b.setHora(req.hora());
        b.setMotivo(req.motivo());
        if (req.barbeiroId() != null) {
            Barbeiro barb = barbeiros.findById(req.barbeiroId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Barbeiro não encontrado"));
            b.setBarbeiro(barb);
        }
        BloqueioHorario salvo = bloqueios.save(b);
        return mapBloqueio(salvo);
    }

    public void removerBloqueio(Long id) {
        if (!bloqueios.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Bloqueio não encontrado");
        }
        bloqueios.deleteById(id);
    }

    public List<Map<String, Object>> listarBloqueios(java.time.LocalDate data) {
        return bloqueios.findByData(data).stream().map(this::mapBloqueio).toList();
    }

    private void aplicarBarbeiro(Barbeiro b, BarbeiroRequest req) {
        b.setNome(req.nome().trim());
        String ini = req.iniciais() != null && !req.iniciais().isBlank()
                ? req.iniciais().trim().toUpperCase()
                : iniciaisDe(req.nome());
        b.setIniciais(ini.substring(0, Math.min(4, ini.length())));
        b.setCor(req.cor() != null && !req.cor().isBlank() ? req.cor() : "#3d3d3d");
        if (req.ativo() != null) b.setAtivo(req.ativo());
    }

    private void aplicarServico(Servico s, ServicoRequest req) {
        s.setNome(req.nome().trim());
        s.setPreco(req.preco());
        s.setDuracaoMin(req.duracaoMin());
        if (req.ativo() != null) s.setAtivo(req.ativo());
    }

    private String iniciaisDe(String nome) {
        String[] p = nome.trim().split("\\s+");
        if (p.length == 1) return p[0].substring(0, Math.min(2, p[0].length())).toUpperCase();
        return ("" + p[0].charAt(0) + p[p.length - 1].charAt(0)).toUpperCase();
    }

    public Map<String, Object> mapBarbeiro(Barbeiro b) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", b.getId());
        m.put("nome", b.getNome());
        m.put("iniciais", b.getIniciais());
        m.put("cor", b.getCor());
        m.put("ativo", b.isAtivo());
        return m;
    }

    public Map<String, Object> mapServico(Servico s) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", s.getId());
        m.put("nome", s.getNome());
        m.put("preco", s.getPreco());
        m.put("duracaoMin", s.getDuracaoMin());
        m.put("ativo", s.isAtivo());
        return m;
    }

    private Map<String, Object> mapBloqueio(BloqueioHorario b) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", b.getId());
        m.put("data", b.getData().toString());
        m.put("hora", b.getHora().toString().substring(0, 5));
        m.put("motivo", b.getMotivo());
        m.put("barbeiroId", b.getBarbeiro() != null ? b.getBarbeiro().getId() : null);
        m.put("barbeiroNome", b.getBarbeiro() != null ? b.getBarbeiro().getNome() : "Todos");
        return m;
    }
}
